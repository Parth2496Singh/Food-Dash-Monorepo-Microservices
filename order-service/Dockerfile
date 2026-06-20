# Stage 1: Builder
FROM golang:1.23-alpine AS builder
WORKDIR /app
# Install necessary tools for downloading dependencies and handling certs
RUN apk update && apk add --no-cache git ca-certificates tzdata
# Create a non-root user to port over to the final scratch image
RUN adduser -D -g '' appuser
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Build binary: CGO_ENABLED=0 ensures it's statically linked. 
# -ldflags="-s -w" strips debug information to reduce size.
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -a -installsuffix cgo -o order-service .

# Stage 2: Production Runner (Zero-Distro)
FROM scratch
# Import user, group, timezone, and SSL cert files from the builder
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
WORKDIR /app
# Copy the compiled executable
COPY --from=builder /app/order-service .
# Run securely
USER appuser
EXPOSE 3003
ENTRYPOINT ["/app/order-service"]
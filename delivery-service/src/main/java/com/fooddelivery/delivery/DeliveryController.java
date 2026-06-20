package com.fooddelivery.delivery;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/delivery")
public class DeliveryController {

    @Autowired(required = false)
    private DeliveryRepository repository;

    private final Map<String, DeliveryStatus> mockCache = new ConcurrentHashMap<>();

    static class UpdateRequest {
        public String orderId;
        public String status;
    }

    private boolean isRedisAvailable() {
        return repository != null;
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<?> getDeliveryStatus(@PathVariable String orderId) {
        try {
            DeliveryStatus status = null;
            if (isRedisAvailable()) {
                status = repository.findById(orderId).orElse(null);
            } else {
                status = mockCache.get(orderId);
            }

            if (status == null) {
                status = new DeliveryStatus(orderId, "Dispatched", "Pending Assignment", "Order is being assigned to a delivery partner.");
                if (isRedisAvailable()) repository.save(status);
                else mockCache.put(orderId, status);
            }
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            System.err.println("⚠️ Redis Error: " + e.getMessage() + ". Falling back to local cache.");
            DeliveryStatus status = mockCache.getOrDefault(orderId, new DeliveryStatus(orderId, "Dispatched", "Pending Assignment", "Order is being assigned to a delivery partner."));
            mockCache.put(orderId, status);
            return ResponseEntity.ok(status);
        }
    }

    @PostMapping("/update")
    public ResponseEntity<?> updateDeliveryStatus(@RequestBody UpdateRequest request) {
        if (request.orderId == null || request.status == null) {
            return ResponseEntity.badRequest().body("orderId and status are required");
        }
        
        System.out.println("Received order update for ID: " + request.orderId + " with status: " + request.status);
        
        DeliveryStatus status = new DeliveryStatus(
            request.orderId, 
            request.status, 
            "Alex Courier", 
            "Order Successfully Placed & Dispatched to Delivery Partner"
        );

        try {
            if (isRedisAvailable()) {
                repository.save(status);
            } else {
                mockCache.put(request.orderId, status);
            }
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            System.err.println("⚠️ Redis Error: " + e.getMessage() + ". Falling back to local cache.");
            mockCache.put(request.orderId, status);
            return ResponseEntity.ok(status);
        }
    }
}

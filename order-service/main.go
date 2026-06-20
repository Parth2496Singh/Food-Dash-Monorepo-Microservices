package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type Order struct {
	ID           uint    `gorm:"primaryKey"`
	OrderID      string  `gorm:"uniqueIndex"`
	RestaurantID string
	CustomerName string
	TotalAmount  float64
	Status       string
	Items        string  `gorm:"type:text"` // Storing JSON string for simplicity
}

type OrderItem struct {
	MenuId   string  `json:"menuId" binding:"required"`
	Quantity int     `json:"quantity" binding:"required"`
	Price    float64 `json:"price" binding:"required"`
}

type OrderRequest struct {
	RestaurantId string      `json:"restaurantId" binding:"required"`
	Items        []OrderItem `json:"items" binding:"required,min=1"`
	CustomerName string      `json:"customerName" binding:"required"`
}

var db *gorm.DB
var useMockDB bool
var mockOrders = make(map[string]Order)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	dsn := os.Getenv("MYSQL_DSN")
	if dsn == "" || strings.Contains(dsn, "user:password") {
		log.Println("⚠️ MYSQL_DSN is a placeholder or missing. Falling back to Local Mock Mode.")
		useMockDB = true
	} else {
		db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
		if err != nil {
			log.Printf("⚠️ Failed to connect to MySQL database: %v. Falling back to Local Mock Mode.", err)
			useMockDB = true
		} else {
			err = db.AutoMigrate(&Order{})
			if err != nil {
				log.Printf("⚠️ Failed to auto-migrate schema: %v. Falling back to Local Mock Mode.", err)
				useMockDB = true
			} else {
				log.Println("✅ MySQL Connected Successfully")
			}
		}
	}

	r := gin.Default()
	r.Use(cors.Default())

	r.POST("/api/orders", func(c *gin.Context) {
		var req OrderRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var total float64
		for _, item := range req.Items {
			total += item.Price * float64(item.Quantity)
		}

		itemsJSON, _ := json.Marshal(req.Items)
		orderId := strconv.Itoa(rand.Intn(1000000))
		
		newOrder := Order{
			OrderID:      orderId,
			RestaurantID: req.RestaurantId,
			CustomerName: req.CustomerName,
			TotalAmount:  total,
			Status:       "Created",
			Items:        string(itemsJSON),
		}

		if useMockDB {
			mockOrders[orderId] = newOrder
		} else {
			if err := db.Create(&newOrder).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save order to database"})
				return
			}
		}

		go notifyDeliveryService(orderId)

		c.JSON(http.StatusCreated, gin.H{
			"id":           newOrder.OrderID,
			"restaurantId": newOrder.RestaurantID,
			"customerName": newOrder.CustomerName,
			"totalAmount":  newOrder.TotalAmount,
			"status":       newOrder.Status,
			"items":        req.Items,
		})
	})

	r.GET("/api/orders/:id", func(c *gin.Context) {
		id := c.Param("id")
		var order Order
		
		if useMockDB {
			var exists bool
			order, exists = mockOrders[id]
			if !exists {
				c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
				return
			}
		} else {
			if err := db.First(&order, "order_id = ?", id).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
				return
			}
		}
		
		var items []OrderItem
		json.Unmarshal([]byte(order.Items), &items)

		c.JSON(http.StatusOK, gin.H{
			"id":           order.OrderID,
			"restaurantId": order.RestaurantID,
			"customerName": order.CustomerName,
			"totalAmount":  order.TotalAmount,
			"status":       order.Status,
			"items":        items,
		})
	})

	r.Run(":3003")
}

func notifyDeliveryService(orderId string) {
	payload := map[string]string{
		"orderId": orderId,
		"status":  "Order Dispatched to Courier",
	}
	jsonData, _ := json.Marshal(payload)

	deliveryUrl := os.Getenv("DELIVERY_SERVICE_URL")
	if deliveryUrl == "" {
		deliveryUrl = "http://localhost:3004"
	}
	webhookEndpoint := deliveryUrl + "/api/delivery/update"

	resp, err := http.Post(webhookEndpoint, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Println("⚠️ Error notifying delivery service:", err)
		return
	}
	defer resp.Body.Close()
	fmt.Println("✅ Delivery service notified for order:", orderId, "Status code:", resp.StatusCode)
}

func init() {
	rand.Seed(time.Now().UnixNano())
}

package com.fooddelivery.delivery;

import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;

@RedisHash("DeliveryStatus")
public class DeliveryStatus {
    @Id
    public String orderId;
    public String status;
    public String driverName;
    public String message;

    public DeliveryStatus() {}

    public DeliveryStatus(String orderId, String status, String driverName, String message) {
        this.orderId = orderId;
        this.status = status;
        this.driverName = driverName;
        this.message = message;
    }
}

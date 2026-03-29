package com.aimanju.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_login_record")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLoginRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account", nullable = false)
    private String account;

    @Column(name = "login_ip")
    private String loginIp;

    @Column(name = "login_address")
    private String loginAddress;

    @CreationTimestamp
    @Column(name = "login_time", updatable = false)
    private LocalDateTime loginTime;
}

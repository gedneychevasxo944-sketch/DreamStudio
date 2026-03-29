package com.aimanju.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account", nullable = false, unique = true)
    private String account;

    @Column(name = "name")
    private String name;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "avatar")
    private String avatar;

    @Column(name = "status", nullable = false)
    private Integer status;

    @CreationTimestamp
    @Column(name = "create_time", updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    @Column(name = "update_time")
    private LocalDateTime updateTime;
}

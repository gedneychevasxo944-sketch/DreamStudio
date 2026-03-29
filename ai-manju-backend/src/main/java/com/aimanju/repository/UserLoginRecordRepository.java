package com.aimanju.repository;

import com.aimanju.entity.UserLoginRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserLoginRecordRepository extends JpaRepository<UserLoginRecord, Long> {

    List<UserLoginRecord> findByAccountOrderByLoginTimeDesc(String account);
}

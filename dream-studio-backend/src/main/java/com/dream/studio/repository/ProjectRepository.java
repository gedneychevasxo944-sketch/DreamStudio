package com.dream.studio.repository;

import com.dream.studio.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByAccountOrderByUpdatedTimeDesc(String account);

    Optional<Project> findByIdAndAccount(Long id, String account);
}

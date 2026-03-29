package com.aimanju.repository;

import com.aimanju.entity.ProjectVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectVersionRepository extends JpaRepository<ProjectVersion, Long> {

    List<ProjectVersion> findByProjectIdOrderByVersionNumberDesc(Long projectId);

    Optional<ProjectVersion> findByProjectIdAndVersionNumber(Long projectId, Integer versionNumber);

    void deleteByProjectIdAndVersionNumber(Long projectId, Integer versionNumber);
}

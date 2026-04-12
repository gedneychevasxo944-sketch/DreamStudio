package com.dream.studio.repository;

import com.dream.studio.entity.NodeVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NodeVersionRepository extends JpaRepository<NodeVersion, Long> {

    List<NodeVersion> findByProjectIdAndNodeIdOrderByVersionNoDesc(Long projectId, String nodeId);

    Optional<NodeVersion> findTopByProjectIdAndNodeIdOrderByVersionNoDesc(Long projectId, String nodeId);

    Optional<NodeVersion> findByProjectIdAndNodeIdAndIsCurrent(Long projectId, String nodeId, Boolean isCurrent);

    Optional<NodeVersion> findByIdAndProjectId(Long id, Long projectId);

    @Query("SELECT MAX(n.versionNo) FROM NodeVersion n WHERE n.projectId = :projectId AND n.nodeId = :nodeId")
    Optional<Integer> findMaxVersionNo(@Param("projectId") Long projectId, @Param("nodeId") String nodeId);

    @Modifying
    @Query("UPDATE NodeVersion n SET n.isCurrent = false WHERE n.projectId = :projectId AND n.nodeId = :nodeId")
    void clearCurrentByProjectAndNode(@Param("projectId") Long projectId, @Param("nodeId") String nodeId);

    List<NodeVersion> findByProjectIdAndNodeIdAndStatus(Long projectId, String nodeId, String status);

    List<NodeVersion> findBySourceExecutionId(Long sourceExecutionId);
}

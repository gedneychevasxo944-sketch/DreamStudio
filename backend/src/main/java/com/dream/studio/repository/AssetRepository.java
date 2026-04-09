package com.dream.studio.repository;

import com.dream.studio.entity.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {

    List<Asset> findByProjectIdAndNodeIdOrderByCreatedTimeDesc(Long projectId, String nodeId);

    List<Asset> findByProjectIdAndNodeIdAndIsCurrentOrderByCreatedTimeDesc(Long projectId, String nodeId, Boolean isCurrent);

    Optional<Asset> findByIdAndProjectId(Long id, Long projectId);

    List<Asset> findByNodeVersionId(Long nodeVersionId);

    List<Asset> findByProjectIdAndAssetTypeAndIsCurrent(Long projectId, String assetType, Boolean isCurrent);

    @Modifying
    @Query("UPDATE Asset a SET a.isCurrent = false WHERE a.projectId = :projectId AND a.nodeId = :nodeId")
    void clearCurrentByProjectAndNode(@Param("projectId") Long projectId, @Param("nodeId") String nodeId);

    List<Asset> findByProjectIdOrderByCreatedTimeDesc(Long projectId);
}

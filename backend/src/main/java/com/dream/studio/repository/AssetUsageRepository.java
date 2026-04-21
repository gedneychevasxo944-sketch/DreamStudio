package com.dream.studio.repository;

import com.dream.studio.entity.AssetUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetUsageRepository extends JpaRepository<AssetUsage, Long> {

    List<AssetUsage> findByAssetId(String assetId);

    List<AssetUsage> findByProjectId(Long projectId);

    List<AssetUsage> findByAssetIdAndProjectId(String assetId, Long projectId);

    boolean existsByAssetIdAndUsedByNodeId(String assetId, String usedByNodeId);

    void deleteByAssetId(String assetId);
}

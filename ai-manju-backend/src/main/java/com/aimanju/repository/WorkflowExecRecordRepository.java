package com.aimanju.repository;

import com.aimanju.entity.WorkflowExecRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowExecRecordRepository extends JpaRepository<WorkflowExecRecord, Long> {

    Optional<WorkflowExecRecord> findByProjectIdAndProjectVersion(Long projectId, Integer projectVersion);

    List<WorkflowExecRecord> findByProjectIdOrderByCreateTimeDesc(Long projectId);

    Optional<WorkflowExecRecord> findByExecutionId(String executionId);
}

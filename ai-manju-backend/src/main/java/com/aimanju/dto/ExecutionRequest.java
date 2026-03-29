package com.aimanju.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionRequest {
    private Long executionId;
    private Integer projectVersion;
    private DAGDTO dag;
}

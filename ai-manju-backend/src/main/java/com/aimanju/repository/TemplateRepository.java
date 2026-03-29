package com.aimanju.repository;

import com.aimanju.entity.Template;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TemplateRepository extends JpaRepository<Template, Long> {

    List<Template> findAllByOrderByCreateTimeDesc();
}

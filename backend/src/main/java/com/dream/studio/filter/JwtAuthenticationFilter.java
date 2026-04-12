package com.dream.studio.filter;

import com.dream.studio.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Value("${auth.test-account:}")
    private String testAccount;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String requestPath = request.getRequestURI();
        String authHeader = request.getHeader("Authorization");

        try {
            String jwt = extractJwtFromRequest(request);

            // 测试账号跳过校验
            if (StringUtils.hasText(testAccount) && "test-token".equals(jwt)) {
                UserPrincipal principal = new UserPrincipal(1L, testAccount);
                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
                    );
                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.debug("Test account authenticated: {}", testAccount);
                filterChain.doFilter(request, response);
                return;
            }

            if (StringUtils.hasText(jwt) && jwtUtil.validateToken(jwt)) {
                String account = jwtUtil.getAccountFromToken(jwt);
                Long userId = jwtUtil.getUserIdFromToken(jwt);

                if (account != null) {
                    // 创建认证信息
                    UserPrincipal principal = new UserPrincipal(userId, account);
                    UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                            principal,
                            null,
                            Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
                        );

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.debug("Authenticated user: {}, userId: {} for path: {}", account, userId, requestPath);
                }
            } else {
                log.warn("No valid JWT token found for path: {}, authHeader present: {}", requestPath, authHeader != null);
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication for path: {}, error: {}", requestPath, e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        // 从 Authorization header 获取 token
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    /**
     * 用户主体信息
     */
    public record UserPrincipal(Long userId, String account) {
        public String getName() {
            return account;
        }
    }
}

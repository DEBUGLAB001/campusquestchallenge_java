package com.campusquest.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

@Configuration
public class WebConfig {

    @Bean
    public FilterRegistrationBean<Filter> noCacheFilter() {
        FilterRegistrationBean<Filter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new Filter() {
            @Override
            public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
                    throws IOException, ServletException {
                if (response instanceof HttpServletResponse httpResponse) {
                    httpResponse.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
                    httpResponse.setHeader("Pragma", "no-cache");
                    httpResponse.setHeader("Expires", "0");
                }
                chain.doFilter(request, response);
            }
        });
        registration.addUrlPatterns("/*");
        registration.setOrder(1);
        return registration;
    }
}

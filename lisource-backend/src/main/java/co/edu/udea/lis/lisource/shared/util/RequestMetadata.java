package co.edu.udea.lis.lisource.shared.util;

import jakarta.servlet.http.HttpServletRequest;

public record RequestMetadata(String ip, String userAgent) {
    public static RequestMetadata from(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        String ip = forwarded == null || forwarded.isBlank()
                ? request.getRemoteAddr()
                : forwarded.split(",")[0].trim();
        return new RequestMetadata(limit(ip, 45), limit(request.getHeader("User-Agent"), 500));
    }

    private static String limit(String value, int length) {
        if (value == null) return null;
        return value.length() <= length ? value : value.substring(0, length);
    }
}

package com.lis.reservas.usuario.entity;

/**
 * Authority level of a {@link Usuario}, ordered from least to most
 * privileged.
 *
 * <ul>
 *   <li>{@link #ESTUDIANTE} — books equipment for themselves. The default
 *       for every new Google SSO sign-up.</li>
 *   <li>{@link #AUXILIAR} — staffs the loan desk: validates hand-over and
 *       return of equipment, marks no-shows and flags equipment for
 *       maintenance. Cannot touch the catalog or other people's roles.</li>
 *   <li>{@link #ADMIN} — owns the catalog (equipment CRUD), the people
 *       (role assignment) and discipline (sanctions).</li>
 * </ul>
 *
 * <p>The declaration order is the privilege order, so {@link #atLeast}
 * can compare with {@link Enum#ordinal()}. Adding a role in the middle of
 * this enum changes those comparisons — append, or revisit every caller.
 *
 * <p>Spring Security authorities are derived as {@code ROLE_<name>} by
 * {@link #authority()}, which is what {@code @PreAuthorize("hasRole('ADMIN')")}
 * expects.
 */
public enum Rol {

    ESTUDIANTE,
    AUXILIAR,
    ADMIN;

    /** Spring Security authority string, e.g. {@code ROLE_ADMIN}. */
    public String authority() {
        return "ROLE_" + name();
    }

    /** True when this role is {@code other} or more privileged. */
    public boolean atLeast(Rol other) {
        return this.ordinal() >= other.ordinal();
    }

    /**
     * Parse a role name leniently (case-insensitive, trimmed).
     *
     * @return the parsed role, or {@code fallback} when the input is blank
     *         or unknown.
     */
    public static Rol parseOr(String raw, Rol fallback) {
        if (raw == null || raw.isBlank()) {
            return fallback;
        }
        try {
            return Rol.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return fallback;
        }
    }
}

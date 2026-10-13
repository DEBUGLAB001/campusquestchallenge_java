package com.campusquest.model;

import java.util.Objects;

/**
 * TeamId value object representing unique team identity.
 */
public class TeamId {
    private final String value;

    public TeamId(String value) {
        this.value = value != null ? value.trim() : "";
    }

    public String getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TeamId teamId = (TeamId) o;
        return Objects.equals(value, teamId.value);
    }

    @Override
    public int hashCode() {
        return super.hashCode();
    }

    @Override
    public String toString() {
        return value;
    }
}

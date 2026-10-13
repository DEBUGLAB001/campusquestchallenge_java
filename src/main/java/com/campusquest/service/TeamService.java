package com.campusquest.service;

import com.campusquest.model.TeamId;
import com.campusquest.model.TeamRecord;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class TeamService {

    private final DataStore dataStore;

    public TeamService(DataStore dataStore) {
        this.dataStore = dataStore;
    }

    /**
     * Lookup team by TeamId key.
     * Relies on TeamId implementing value equality and consistent hashCode.
     */
    public TeamRecord getTeam(TeamId teamId) {
        return dataStore.getTeams().get(teamId);
    }

    public TeamRecord getTeamById(String idString) {
        return getTeam(new TeamId(idString));
    }

    public List<TeamRecord> getAllTeams() {
        return new ArrayList<>(dataStore.getTeams().values());
    }
}

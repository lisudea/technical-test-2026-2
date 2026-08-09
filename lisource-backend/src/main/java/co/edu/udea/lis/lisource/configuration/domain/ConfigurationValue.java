package co.edu.udea.lis.lisource.configuration.domain;

import com.fasterxml.jackson.databind.JsonNode;

public record ConfigurationValue(long id, String key, JsonNode value, String description,
                                 String categoryCode, String categoryName) {}


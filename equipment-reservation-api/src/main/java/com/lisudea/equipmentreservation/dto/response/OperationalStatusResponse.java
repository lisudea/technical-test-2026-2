package com.lisudea.equipmentreservation.dto.response;

public class OperationalStatusResponse {
    private Long id;
    private String name;
    private String code;

    public OperationalStatusResponse() {}

    public OperationalStatusResponse(Long id, String name) {
        this.id = id;
        this.name = name;
        this.code = "OPERATIONAL".equals(name) ? "AVAILABLE" : name;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}

package equipment_api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class ReservationRequest {

    @NotNull(message = "El id del equipo es obligatorio")
    private Long equipmentId;

    @NotNull(message = "La fecha y hora de inicio es obligatoria")
    @Future(message = "La fecha y hora de inicio debe estar en el futuro")
    private LocalDateTime startTime;

    @NotNull(message = "La fecha y hora de fin es obligatoria")
    @Future(message = "La fecha y hora de fin debe estar en el futuro")
    private LocalDateTime endTime;

    /**
     * Identificacion del usuario que reserva.
     *
     * Son OPCIONALES a nivel de anotacion pero obligatorios en la practica
     * cuando la peticion llega SIN autenticar: el enunciado exige que "un
     * usuario identificado por nombre y correo" pueda reservar.
     *
     * Si la peticion trae un JWT valido, estos campos se IGNORAN y la identidad
     * se toma del token, de modo que nadie pueda reservar en nombre de otro.
     * La comprobacion se hace en ReservationService para poder devolver un
     * mensaje de error claro segun el caso.
     */
    @Size(max = 120, message = "El nombre no puede superar los 120 caracteres")
    private String userName;

    @Email(message = "El correo no tiene un formato valido")
    @Size(max = 150, message = "El correo no puede superar los 150 caracteres")
    private String userEmail;

    public ReservationRequest() {}

    public Long getEquipmentId() {
        return equipmentId;
    }

    public void setEquipmentId(Long equipmentId) {
        this.equipmentId = equipmentId;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }
}
package com.udea.lis.exception;

public class ReservationConflictException extends RuntimeException {

    public ReservationConflictException(String message) {
        super(message);
    }

    public ReservationConflictException(Long equipmentId) {
        super("The equipment with id " + equipmentId + " is already reserved during the requested period");
    }
}

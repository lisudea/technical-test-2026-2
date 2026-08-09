package com.example.lis_equipment_system.reservation.entity;

import com.example.lis_equipment_system.equipment.entity.Equipment;
import com.example.lis_equipment_system.reservation.entity.enumerator.ReservationStatus;
import com.example.lis_equipment_system.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "reservation")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_equipment", nullable = false)
    private Equipment equipment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_user", nullable = false)
    private User user;

    @Column(name = "date_start_time", nullable = false)
    private LocalDateTime dateStartTime;

    @Column(name = "date_end_time", nullable = false)
    private LocalDateTime dateEndTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ReservationStatus status;

    @Column(name = "creation_date", nullable = false)
    private LocalDateTime creationDate;
}
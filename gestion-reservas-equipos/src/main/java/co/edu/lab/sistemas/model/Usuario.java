package co.edu.lab.sistemas.model;

import co.edu.lab.sistemas.enums.Rol;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
// Usuario interno minimo para tareas administrativas del sistema.
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false, unique = true)
    // Se usa como identificador de contacto y no debe repetirse.
    private String correo;

    @Column(nullable = false)
    // Se almacena encriptada y no debe ser visible.
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    // Rol actual del usuario en el sistema.
    private Rol rol;
}
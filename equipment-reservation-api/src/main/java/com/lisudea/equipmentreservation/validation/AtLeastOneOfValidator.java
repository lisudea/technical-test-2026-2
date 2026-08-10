package com.lisudea.equipmentreservation.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.lang.reflect.Field;

public class AtLeastOneOfValidator implements ConstraintValidator<AtLeastOneOf, Object> {

    private String[] fields;

    @Override
    public void initialize(AtLeastOneOf constraintAnnotation) {
        this.fields = constraintAnnotation.fields();
    }

    @Override
    public boolean isValid(Object value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }

        for (String fieldName : fields) {
            Object fieldValue = getFieldValue(value, fieldName);
            if (fieldValue instanceof String stringValue) {
                if (!stringValue.isBlank()) {
                    return true;
                }
            } else if (fieldValue != null) {
                return true;
            }
        }

        return false;
    }

    private Object getFieldValue(Object value, String fieldName) {
        try {
            Field field = value.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            return field.get(value);
        } catch (NoSuchFieldException | IllegalAccessException exception) {
            throw new IllegalStateException("Unable to validate field " + fieldName, exception);
        }
    }
}

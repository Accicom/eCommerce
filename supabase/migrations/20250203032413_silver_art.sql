/*
  # Agregar campo de código de descuento

  1. Cambios
    - Agregar columna `discount_code` a la tabla `popup_config`
    - La columna es obligatoria y debe contener solo letras mayúsculas y números
*/

-- Agregar la columna discount_code
ALTER TABLE popup_config ADD COLUMN IF NOT EXISTS discount_code text NOT NULL DEFAULT 'BIENVENIDA';

-- Agregar restricción para el formato del código
ALTER TABLE popup_config ADD CONSTRAINT popup_config_discount_code_check 
  CHECK (discount_code ~ '^[A-Z0-9]+$');
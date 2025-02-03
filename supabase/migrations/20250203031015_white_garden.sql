/*
  # Configuración del Pop-up de Newsletter

  1. Nueva Tabla
    - `popup_config`
      - `id` (uuid, primary key)
      - `title` (text, título del pop-up)
      - `subtitle` (text, subtítulo del pop-up)
      - `discount_percentage` (integer, porcentaje de descuento)
      - `button_text` (text, texto del botón)
      - `terms_text` (text, texto de términos y condiciones)
      - `success_title` (text, título del mensaje de éxito)
      - `success_message` (text, mensaje de éxito)
      - `active` (boolean, estado del pop-up)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en la tabla
    - Permitir lectura a todos los usuarios
    - Permitir escritura solo a usuarios autenticados
*/

-- Create popup_config table
CREATE TABLE IF NOT EXISTS popup_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text NOT NULL,
  discount_percentage integer NOT NULL,
  button_text text NOT NULL,
  terms_text text NOT NULL,
  success_title text NOT NULL,
  success_message text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE popup_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON popup_config
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON popup_config
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON popup_config
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE TRIGGER update_popup_config_updated_at
  BEFORE UPDATE ON popup_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
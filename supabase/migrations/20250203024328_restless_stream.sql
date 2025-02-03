/*
  # Crear tabla de suscriptores del newsletter

  1. Nueva Tabla
    - `newsletter_subscribers`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `status` (text) - Para manejar estados como 'active', 'unsubscribed'
      - `source` (text) - De dónde vino la suscripción (ej: 'popup', 'footer')
      - `discount_code` (text) - Código de descuento único
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Enable RLS
    - Políticas para:
      - Inserción pública (cualquiera puede suscribirse)
      - Lectura solo para usuarios autenticados
*/

-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active',
  source text NOT NULL,
  discount_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable insert for all users" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users only" ON newsletter_subscribers
  FOR SELECT TO authenticated USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_newsletter_subscribers_updated_at
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
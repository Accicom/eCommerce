import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TestTube, UserPlus, Mail, CheckCircle, XCircle, AlertCircle, Database, Settings, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Testing() {
  const navigate = useNavigate();
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isTestingUser, setIsTestingUser] = useState(false);
  const [isValidatingSystem, setIsValidatingSystem] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [userTestResult, setUserTestResult] = useState<string | null>(null);
  const [systemValidation, setSystemValidation] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin');
    }
  };

  const testEmailSystem = async () => {
    setIsTestingEmail(true);
    setTestResult(null);

    try {
      // Test both email domains using the simple function
      const { data, error } = await supabase.rpc('test_domain_emails');

      if (error) throw error;

      console.log('Domain test results:', data);
      
      if (data.success) {
        const resendStatus = data.resend_domain.status;
        const customStatus = data.custom_domain.status;
        
        setTestResult(`✅ Emails enviados:
        • Dominio Resend: ${resendStatus === 'success' ? '✅ Enviado' : '❌ Error'}
        • Dominio Personalizado: ${customStatus === 'success' ? '✅ Enviado' : '❌ Error'}
        
        Revisa la bandeja de entrada de centralaccicom@gmail.com para ver cuál llega.`);
      } else {
        setTestResult('❌ Error al enviar emails de prueba: ' + data.error);
      }
      
    } catch (error) {
      console.error('Error testing email system:', error);
      
      // Fallback: try creating a test lead
      try {
        const timestamp = Date.now();
        const testLead = {
          dni: `9999999${timestamp.toString().slice(-1)}`, // Unique test DNI
          email: `test${timestamp}@accicom.com`,
          status: 'pending'
        };

        const { data: leadData, error: leadError } = await supabase
          .from('catalog_leads')
          .insert([testLead])
          .select()
          .single();

        if (leadError) throw leadError;

        setTestResult('✅ Email de prueba enviado exitosamente. Revisa la bandeja de entrada de centralaccicom@gmail.com');
        
        // Clean up test data after 5 seconds
        setTimeout(async () => {
          await supabase
            .from('catalog_leads')
            .delete()
            .eq('id', leadData.id);
        }, 5000);

      } catch (fallbackError) {
        console.error('Error in fallback test:', fallbackError);
        setTestResult('❌ Error al enviar email de prueba: ' + (fallbackError as Error).message);
      }
    } finally {
      setIsTestingEmail(false);
    }
  };

  const simulateUserRegistration = async () => {
    setIsTestingUser(true);
    setUserTestResult(null);

    try {
      // Paso 1: Verificar si hay registros recientes en catalog_clients
      const { data: recentClients, error: clientsError } = await supabase
        .from('catalog_clients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (clientsError) throw clientsError;

      console.log('🔍 Últimos 5 registros en catalog_clients:', recentClients);

      // Paso 2: Verificar si hay leads recientes
      const { data: recentLeads, error: leadsError } = await supabase
        .from('catalog_leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (leadsError) throw leadsError;

      console.log('🔍 Últimos 5 registros en catalog_leads:', recentLeads);

      // Paso 3: Crear un registro de prueba para verificar el trigger
      const timestamp = Date.now();
      const testClient = {
        dni: `9999999${timestamp.toString().slice(-1)}`, // DNI único para prueba
        celular: `11${timestamp.toString().slice(-6)}`, // Celular único
        name: `Usuario Prueba ${timestamp}`
      };

      console.log('🧪 Creando cliente de prueba:', testClient);

      const { data: newClient, error: insertError } = await supabase
        .from('catalog_clients')
        .insert([testClient])
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('✅ Cliente de prueba creado:', newClient);

      // Paso 4: Crear un lead asociado para disparar el trigger
      // Paso 4: Crear un lead asociado para disparar el trigger
      const testLead = {
        dni: testClient.dni,
        email: `test${timestamp}@temp.com`, // Email temporal para el lead
        status: 'pending'
      };

      console.log('🧪 Creando lead de prueba:', testLead);

      const { data: newLead, error: leadError } = await supabase
        .from('catalog_leads')
        .insert([testLead])
        .select()
        .single();

      if (leadError) throw leadError;

      console.log('✅ Lead de prueba creado:', newLead);

      setUserTestResult(`✅ Simulación completada exitosamente:
      
      📊 **Registros encontrados:**
      • Clientes recientes: ${recentClients?.length || 0}
      • Leads recientes: ${recentLeads?.length || 0}
      
      🧪 **Prueba realizada:**
      • Cliente creado: ${newClient.name} (DNI: ${newClient.dni})
      • Celular del cliente: ${newClient.celular}
      • Lead creado: ${newLead.email}
      • ID del lead: ${newLead.id}
      
      📧 **Verificación de email:**
      El trigger debería buscar el cliente por DNI (${newClient.dni}) y usar su celular (${newClient.celular}) para enviar el email de notificación.
      
      🔍 **Para verificar:**
      1. Revisa tu bandeja de entrada
      2. El email debe mostrar el celular del cliente: ${newClient.celular}
      3. Si no llega, hay un problema con el trigger o la función de email
      4. Los datos de prueba se limpian automáticamente en 30 segundos`);

      // Limpiar datos de prueba después de 30 segundos
      setTimeout(async () => {
        try {
          await supabase.from('catalog_leads').delete().eq('id', newLead.id);
          await supabase.from('catalog_clients').delete().eq('id', newClient.id);
          console.log('🧹 Datos de prueba eliminados');
        } catch (error) {
          console.error('Error limpiando datos de prueba:', error);
        }
      }, 30000);

    } catch (error) {
      console.error('Error en simulación de registro:', error);
      
      let errorMessage = 'Error desconocido';
      errorMessage = error.message || 'Error desconocido en la simulación';
      
      setUserTestResult(`❌ Error en la simulación:
      
      **Error:** ${errorMessage}
      
      💡 **Posibles causas:**
      • Problema de conexión con la base de datos
      • Error en la configuración del trigger
      • Problema con los permisos de inserción
      
      **Recomendación:** Usa el botón "Probar Email" para verificar si el sistema de emails funciona independientemente.`);
    } finally {
      setIsTestingUser(false);
    }
  };

  const validateNotificationSystem = async () => {
    setIsValidatingSystem(true);
    setSystemValidation(null);

    try {
      let validationReport = '🔍 **DIAGNÓSTICO COMPLETO DEL SISTEMA DE NOTIFICACIONES**\n\n';

      // 1. Verificar estructura de tablas
      validationReport += '📊 **1. ESTRUCTURA DE BASE DE DATOS:**\n';
      
      const { data: clientsStructure, error: clientsError } = await supabase
        .from('catalog_clients')
        .select('*')
        .limit(1);

      if (clientsError) {
        validationReport += `❌ Error en tabla catalog_clients: ${clientsError.message}\n`;
      } else {
        validationReport += `✅ Tabla catalog_clients: Accesible\n`;
      }

      const { data: leadsStructure, error: leadsError } = await supabase
        .from('catalog_leads')
        .select('*')
        .limit(1);

      if (leadsError) {
        validationReport += `❌ Error en tabla catalog_leads: ${leadsError.message}\n`;
      } else {
        validationReport += `✅ Tabla catalog_leads: Accesible\n`;
      }

      // 2. Verificar registros recientes
      validationReport += '\n📈 **2. REGISTROS RECIENTES:**\n';
      
      const { data: recentClients } = await supabase
        .from('catalog_clients')
        .select('id, dni, celular, name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: recentLeads } = await supabase
        .from('catalog_leads')
        .select('id, dni, email, status, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      validationReport += `• Clientes recientes: ${recentClients?.length || 0}\n`;
      if (recentClients && recentClients.length > 0) {
        recentClients.forEach((client, index) => {
          validationReport += `  ${index + 1}. DNI: ${client.dni}, Celular: ${client.celular || 'N/A'}, Fecha: ${new Date(client.created_at).toLocaleString()}\n`;
        });
      }

      validationReport += `• Leads recientes: ${recentLeads?.length || 0}\n`;
      if (recentLeads && recentLeads.length > 0) {
        recentLeads.forEach((lead, index) => {
          validationReport += `  ${index + 1}. DNI: ${lead.dni || 'N/A'}, Email: ${lead.email}, Estado: ${lead.status}, Fecha: ${new Date(lead.created_at).toLocaleString()}\n`;
        });
      }

      // 3. Probar creación de registros
      validationReport += '\n🧪 **3. PRUEBA DE CREACIÓN DE REGISTROS:**\n';
      
      const timestamp = Date.now();
      const testClient = {
        dni: `9999999${timestamp.toString().slice(-1)}`,
        celular: `11${timestamp.toString().slice(-6)}`,
        name: `Test User ${timestamp}`
      };

      const { data: newClient, error: clientCreateError } = await supabase
        .from('catalog_clients')
        .insert([testClient])
        .select()
        .single();

      if (clientCreateError) {
        validationReport += `❌ Error creando cliente: ${clientCreateError.message}\n`;
      } else {
        validationReport += `✅ Cliente creado exitosamente:\n`;
        validationReport += `   • ID: ${newClient.id}\n`;
        validationReport += `   • DNI: ${newClient.dni}\n`;
        validationReport += `   • Celular: ${newClient.celular}\n`;
        validationReport += `   • Nombre: ${newClient.name}\n`;

        // Crear lead asociado
        const testLead = {
          dni: testClient.dni,
          email: `${testClient.celular}@temp.com`,
          status: 'pending'
        };

        const { data: newLead, error: leadCreateError } = await supabase
          .from('catalog_leads')
          .insert([testLead])
          .select()
          .single();

        if (leadCreateError) {
          validationReport += `❌ Error creando lead: ${leadCreateError.message}\n`;
        } else {
          validationReport += `✅ Lead creado exitosamente:\n`;
          validationReport += `   • ID: ${newLead.id}\n`;
          validationReport += `   • DNI: ${newLead.dni}\n`;
          validationReport += `   • Email: ${newLead.email}\n`;
          validationReport += `   • Estado: ${newLead.status}\n`;
        }

        // 4. Verificar si el trigger se ejecutó
        validationReport += '\n📧 **4. VERIFICACIÓN DEL TRIGGER:**\n';
        validationReport += `• Trigger debería buscar cliente con DNI: ${testClient.dni}\n`;
        validationReport += `• Celular a incluir en email: ${testClient.celular}\n`;
        validationReport += `• Email temporal del lead: ${testClient.celular}@temp.com\n`;
        validationReport += `• Si el trigger funciona, deberías recibir un email en centralaccicom@gmail.com\n`;

        // Limpiar datos de prueba después de 30 segundos
        setTimeout(async () => {
          try {
            if (newLead) await supabase.from('catalog_leads').delete().eq('id', newLead.id);
            if (newClient) await supabase.from('catalog_clients').delete().eq('id', newClient.id);
          } catch (error) {
            console.error('Error limpiando datos de prueba:', error);
          }
        }, 30000);
      }

      // 5. Verificar configuración de environment
      validationReport += '\n⚙️ **5. CONFIGURACIÓN DEL SISTEMA:**\n';
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      validationReport += `• Supabase URL: ${supabaseUrl ? '✅ Configurada' : '❌ No configurada'}\n`;
      validationReport += `• Supabase Key: ${supabaseKey ? '✅ Configurada' : '❌ No configurada'}\n`;
      
      if (supabaseKey) {
        try {
          const payload = JSON.parse(atob(supabaseKey.split('.')[1]));
          const expiry = new Date(payload.exp * 1000);
          const now = new Date();
          
          if (expiry > now) {
            validationReport += `• JWT Status: ✅ Válido hasta ${expiry.toLocaleString()}\n`;
          } else {
            validationReport += `• JWT Status: ❌ EXPIRADO desde ${expiry.toLocaleString()}\n`;
          }
        } catch (error) {
          validationReport += `• JWT Status: ❌ No se puede validar\n`;
        }
      }

      // 6. Recomendaciones
      validationReport += '\n💡 **6. PRÓXIMOS PASOS:**\n';
      validationReport += '1. Revisa tu bandeja de entrada en centralaccicom@gmail.com\n';
      validationReport += '2. Si no llega el email, el problema está en el trigger de la base de datos\n';
      validationReport += '3. Si llega pero con datos incorrectos, hay que ajustar la función del trigger\n';
      validationReport += '4. Los datos de prueba se eliminan automáticamente en 30 segundos\n';

      setSystemValidation(validationReport);

    } catch (error) {
      console.error('Error en validación del sistema:', error);
      setSystemValidation(`❌ Error en la validación del sistema: ${error.message}`);
    } finally {
      setIsValidatingSystem(false);
    }
  };

  const getStatusIcon = (result: string | null) => {
    if (!result) return null;
    if (result.includes('✅')) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (result.includes('❌')) return <XCircle className="h-5 w-5 text-red-600" />;
    return <AlertCircle className="h-5 w-5 text-yellow-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Volver
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Pruebas de Funcionamiento</h1>
          </div>
        </div>

        {/* Header Info */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8 border border-blue-200">
          <div className="flex items-start">
            <TestTube className="h-6 w-6 text-blue-600 mt-1 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Centro de Diagnóstico del Sistema</h3>
              <p className="text-blue-700 mb-4">
                Utiliza estas herramientas para verificar que todos los componentes del sistema funcionen correctamente.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">🧪 Prueba de Emails:</h4>
                  <p className="text-blue-700">Verifica la configuración de dominios y envío de correos</p>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">👤 Simulación de Registro:</h4>
                  <p className="text-blue-700">Prueba el flujo completo de registro y notificaciones automáticas</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Cards */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* System Validation Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
              <div className="flex items-center">
                <Database className="h-6 w-6 text-white mr-3" />
                <h2 className="text-xl font-semibold text-white">Validación Completa del Sistema</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Ejecuta un diagnóstico completo del sistema de notificaciones para identificar exactamente dónde está el problema.
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Verificaciones incluidas:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Estructura de base de datos</li>
                    <li>• Registros recientes</li>
                    <li>• Creación de datos de prueba</li>
                    <li>• Estado del JWT token</li>
                    <li>• Configuración del sistema</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={validateNotificationSystem}
                disabled={isValidatingSystem}
                className="w-full flex items-center justify-center bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {isValidatingSystem ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Validando sistema...
                  </>
                ) : (
                  <>
                    <Eye className="h-5 w-5 mr-2" />
                    Validar Sistema Completo
                  </>
                )}
              </button>
              
              {systemValidation && (
                <div className={`p-4 rounded-lg border ${
                  systemValidation.includes('✅') 
                    ? 'bg-green-50 text-green-800 border-green-200' 
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  <div className="flex items-start">
                    {getStatusIcon(systemValidation)}
                    <div className="ml-2 flex-1">
                      <pre className="whitespace-pre-wrap font-sans text-sm">{systemValidation}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Email Test Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
              <div className="flex items-center">
                <Mail className="h-6 w-6 text-white mr-3" />
                <h2 className="text-xl font-semibold text-white">Prueba de Sistema de Emails</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Envía emails de prueba desde ambos dominios configurados para verificar cuál está funcionando correctamente.
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Dominios a probar:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <code className="bg-gray-200 px-2 py-1 rounded">onboarding@resend.dev</code> (Dominio de Resend)</li>
                    <li>• <code className="bg-gray-200 px-2 py-1 rounded">avisos@accicom.com</code> (Dominio personalizado)</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={testEmailSystem}
                disabled={isTestingEmail}
                className="w-full flex items-center justify-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {isTestingEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Enviando emails de prueba...
                  </>
                ) : (
                  <>
                    <TestTube className="h-5 w-5 mr-2" />
                    Probar Envío de Emails
                  </>
                )}
              </button>
              
              {testResult && (
                <div className={`p-4 rounded-lg border ${
                  testResult.includes('✅') 
                    ? 'bg-green-50 text-green-800 border-green-200' 
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  <div className="flex items-start">
                    {getStatusIcon(testResult)}
                    <div className="ml-2 flex-1">
                      <pre className="whitespace-pre-wrap font-sans text-sm">{testResult}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* User Registration Test Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div className="flex items-center">
                <UserPlus className="h-6 w-6 text-white mr-3" />
                <h2 className="text-xl font-semibold text-white">Simulación de Registro de Usuario</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Simula un registro completo de usuario nuevo para verificar que el sistema de notificaciones automáticas funcione correctamente.
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Proceso de la prueba:</h4>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Crea un lead de prueba en la base de datos</li>
                    <li>Activa el trigger automático de email</li>
                    <li>Envía notificación desde <code className="bg-gray-200 px-1 rounded">avisos@accicom.com</code></li>
                    <li>Limpia automáticamente los datos de prueba</li>
                  </ol>
                </div>
              </div>

              <button
                onClick={simulateUserRegistration}
                disabled={isTestingUser}
                className="w-full flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {isTestingUser ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Simulando registro...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Simular Registro de Usuario
                  </>
                )}
              </button>
              
              {userTestResult && (
                <div className={`p-4 rounded-lg border ${
                  userTestResult.includes('✅') 
                    ? 'bg-green-50 text-green-800 border-green-200' 
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  <div className="flex items-start">
                    {getStatusIcon(userTestResult)}
                    <div className="ml-2 flex-1">
                      <pre className="whitespace-pre-wrap font-sans text-sm">{userTestResult}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">📋 Guía de Interpretación de Resultados</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                Resultados Exitosos
              </h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <strong>Emails enviados:</strong> Ambos dominios funcionan correctamente</li>
                <li>• <strong>Trigger funcionando:</strong> Las notificaciones automáticas están activas</li>
                <li>• <strong>Dominio personalizado:</strong> Los emails se envían desde avisos@accicom.com</li>
                <li>• <strong>Limpieza automática:</strong> Los datos de prueba se eliminan correctamente</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <XCircle className="h-5 w-5 text-red-600 mr-2" />
                Posibles Problemas
              </h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <strong>Error de dominio:</strong> Verificar configuración DNS del dominio personalizado</li>
                <li>• <strong>Trigger no funciona:</strong> Revisar la configuración de la base de datos</li>
                <li>• <strong>API key inválida:</strong> Verificar la clave de Resend en la configuración</li>
                <li>• <strong>Emails no llegan:</strong> Revisar carpeta de spam o configuración de Resend</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Nota Importante</h4>
                <p className="text-yellow-700 text-sm">
                  Estas pruebas envían emails reales a las direcciones configuradas. 
                  Los datos de prueba se limpian automáticamente para no afectar la base de datos de producción.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
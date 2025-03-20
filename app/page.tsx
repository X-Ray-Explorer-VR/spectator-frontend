"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";

interface Bone {
  id: number;
  nombre: string;
  descripcion: string;
  parte_id: number;
}

export default function XRayExplorer() {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [animatedName, setAnimatedName] = useState("");
  const [animatedText, setAnimatedText] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [bonesList, setBonesList] = useState<Bone[]>([]); // Lista de huesos recibidos del servidor
  const [fullName, setFullName] = useState(""); // Nombre completo de la parte del esqueleto
  const [fullText, setFullText] = useState(""); // Descripción completa de la parte del esqueleto
  const [, setWs] = useState<WebSocket | null>(null); // Conexión WebSocket
  const [statusMessage, setStatusMessage] = useState<string | null>(null); // Mensaje de estado (conexión, desconexión, etc.)
  const [isWaitingConnection, setIsWaitingConnection] = useState(true); // Estado para controlar el mensaje de espera

  // URL base de la API Flask
  const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";
  const WEBSOCKET_URL = process.env.WEBSOCKET_URL || "ws://localhost:8080";

  // Mapeo de respuestas del servidor WebSocket a partes del esqueleto
  const partMapping: { [key: string]: string } = {
    cranium: "Cráneo",
    "rib-cage": "Caja torácica",
    "spinal-cord": "Columna vertebral",
    "left-top": "Extremidad superior izquierda",
    "right-top": "Extremidad superior derecha",
    "left-hand": "Mano izquierda",
    "right-hand": "Mano derecha",
    "left-bottom": "Extremidad inferior izquierda",
    "right-bottom": "Extremidad inferior derecha",
    "left-foot": "Pie izquierdo",
    "right-foot": "Pie derecho",
  };

  // Función para obtener los datos de la API Flask
  const fetchPartData = async (partName: string) => {
    try {
      // Obtener la parte del esqueleto
      const partesResponse = await fetch(`${API_BASE_URL}/partes`);
      const partes = await partesResponse.json();
      const parte = partes.find(
        (p: { nombre: string }) => p.nombre === partName
      );

      if (parte) {
        // Obtener los huesos asociados
        const huesosResponse = await fetch(
          `${API_BASE_URL}/partes/${parte.id}/huesos`
        );
        const huesos = await huesosResponse.json();

        // Formatear la respuesta
        const partData = {
          part: parte.nombre,
          description: parte.descripcion,
          huesos: huesos,
        };
        return partData;
      }
    } catch (error) {
      console.error("Error al obtener los datos de la API:", error);
    }
    return null;
  };

  // Efecto para manejar la conexión WebSocket
  useEffect(() => {
    const websocket = new WebSocket(WEBSOCKET_URL);

    websocket.onopen = () => {
      console.log("Conexión WebSocket establecida");
      websocket.send("Front-end client: Connected");
      setIsConnected(true); // Mensaje de conexión exitosa
    };

    websocket.onmessage = async (event) => {
      const message = event.data;
      console.log("Mensaje recibido del servidor:", message);

      // Manejar diferentes tipos de mensajes
      if (message.startsWith("Oculus client: Set ")) {
        const partKey = message.replace("Oculus client: Set ", "").trim();

        // Obtener el nombre de la parte del esqueleto usando el mapeo
        const partName = partMapping[partKey];

        if (partName) {
          // Obtener los datos de la parte del esqueleto desde la API Flask
          const partData = await fetchPartData(partName);
          if (partData) {
            // Actualiza la información de la parte del esqueleto
            setFullName(partData.part);
            setFullText(partData.description);

            // Actualiza la lista de huesos
            setBonesList(partData.huesos);

            // Si no hay una parte seleccionada, selecciona la parte recibida
            if (!selectedPart) {
              setSelectedPart(partData.part);
              setAnimatedName("");
              setAnimatedText("");
              setIsAnimating(true);
            }
          }
        } else {
          console.error(
            "Parte del esqueleto no encontrada en el mapeo:",
            partKey
          );
        }
      } else if (message === "Oculus client: Connected") {
        setStatusMessage("Conexión exitosa"); // Mensaje de conexión exitosa
        setIsWaitingConnection(false); // Ocultar el mensaje de espera
      } else if (message === "Oculus client: Remove") {
        // Limpiar la información mostrada
        setSelectedPart(null);
        setFullName("");
        setFullText("");
        setBonesList([]);
        setAnimatedName("");
        setAnimatedText("");
        setIsAnimating(false);
        setStatusMessage(null); // Limpiar el mensaje de estado
      } else if (message === "Oculus client: Disconnected") {
        setStatusMessage("El Oculus se ha desconectado"); // Mensaje de desconexión
        setIsConnected(false);
      }
    };

    websocket.onclose = () => {
      console.log("Conexión WebSocket cerrada");
      setIsConnected(false);
      //setStatusMessage("El Oculus se ha desconectado") // Mensaje de desconexión
    };

    websocket.onerror = (error) => {
      console.error("Error en la conexión WebSocket:", error);
      setStatusMessage("Error de conexión con el Oculus"); // Mensaje de error
    };

    setWs(websocket);

    // Cerrar la conexión al desmontar el componente
    return () => {
      websocket.close();
    };
  }, []);

  // Efecto para manejar la animación del texto
  useEffect(() => {
    if (isAnimating) {
      if (animatedName.length < fullName.length) {
        const timeout = setTimeout(() => {
          setAnimatedName(fullName.slice(0, animatedName.length + 1));
        }, 200); // Más lento para el nombre
        return () => clearTimeout(timeout);
      } else if (animatedText.length < fullText.length) {
        const timeout = setTimeout(() => {
          setAnimatedText(fullText.slice(0, animatedText.length + 1));
        }, 20); // Más rápido para la descripción
        return () => clearTimeout(timeout);
      } else {
        setIsAnimating(false);
      }
    }
  }, [animatedName, animatedText, isAnimating, fullName, fullText]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <header className="sticky top-0 z-10 border-b border-gray-700 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
        <div className="container flex h-16 items-center justify-between mx-auto">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Eye className="h-6 w-6" />
            <span>X-Ray Explorer VR</span>
          </div>
          {/* Eliminado el botón "Analizar" */}
        </div>
      </header>

      <main className="flex-1 container py-12 mx-auto">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2 text-white">
                Exploración del Esqueleto Humano
              </h2>
              <p className="text-gray-400">
                Descubre los secretos del cuerpo humano en realidad virtual
              </p>
            </div>

            {statusMessage && (
              <div className="text-center mb-4">
                <p className="text-blue-400 text-lg">{statusMessage}</p>
              </div>
            )}

            {isWaitingConnection && (
              <div className="text-center py-5">
                <div className="wave-text text-2xl font-semibold text-blue-400">
                  {"Esperando conexión..."
                    .split(/(\s+)/) // Dividir en palabras y espacios
                    .map((word, wordIndex) =>
                      word === " " ? (
                        <span
                          key={wordIndex}
                          style={{ display: "inline-block", width: "0.25em" }}
                        >
                          {" "}
                        </span> // Mantener espacios
                      ) : (
                        <span
                          key={wordIndex}
                          style={{ display: "inline-block" }}
                        >
                          {word.split("").map((letter, letterIndex) => (
                            <span
                              key={letterIndex}
                              style={{
                                display: "inline-block",
                                animation: `wave 1.5s infinite`,
                                animationDelay: `${
                                  (wordIndex + letterIndex) * 0.1
                                }s`, // Retraso progresivo
                              }}
                            >
                              {letter}
                            </span>
                          ))}
                        </span>
                      )
                    )}
                </div>
              </div>
            )}

            {isConnected ? (
              selectedPart ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-center">
                    <svg
                      className="w-32 h-32 text-blue-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v1.1A2 2 0 0 0 5 7v0a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v0a2 2 0 0 0-1-1.9V4Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10 4v16"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 4v16"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 20h8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M7 7h0"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M17 7h0"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <h3 className="text-4xl font-bold text-blue-400 mb-4 min-h-[2.5rem]">
                      {animatedName}
                      {isAnimating && animatedName.length < fullName.length && (
                        <span className="animate-pulse text-blue-300">|</span>
                      )}
                    </h3>
                    <p className="text-gray-300 max-w-2xl mx-auto min-h-[6rem] text-lg">
                      {animatedText}
                      {isAnimating &&
                        animatedName.length === fullName.length && (
                          <span className="animate-pulse text-blue-300">|</span>
                        )}
                    </p>
                  </div>
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h4 className="font-semibold text-blue-300 mb-4 text-xl">
                      Huesos principales:
                    </h4>
                    <ul className="list-disc list-inside text-gray-300 space-y-2">
                      {bonesList.length === 0 ? (
                        <li className="text-lg text-gray-400">
                          Cargando huesos...
                        </li>
                      ) : (
                        bonesList.map((bone, index) => (
                          <li key={index} className="text-lg">
                            <strong>{bone.nombre}</strong>: {bone.descripcion}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="w-24 h-24 mx-auto text-gray-600 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold mb-2">
                    Esperando selección de parte del cuerpo
                  </h3>
                  <p className="text-gray-400">
                    Interactúa con una parte del cuerpo en el entorno VR para
                    ver su información detallada
                  </p>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <svg
                  className="w-24 h-24 mx-auto text-gray-600 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                  />
                </svg>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-gray-700 py-6">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 mx-auto">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} X-Ray Explorer VR. Todos los derechos
            reservados.
          </p>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              Ayuda
            </Button>
            <Button variant="ghost" size="sm">
              Privacidad
            </Button>
            <Button variant="ghost" size="sm">
              Términos
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

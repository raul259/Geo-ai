'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  icon?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: '¡Bienvenido a GeoAI Assistant! 🌍',
    description: 'Esta aplicación te permite consultar información meteorológica de cualquier punto del mundo y visualizar diferentes capas climáticas en el mapa.',
    icon: '👋'
  },
  {
    title: 'Chat con IA 💬',
    description: 'Utiliza el chat para hacer preguntas sobre clima, ubicaciones y datos geoespaciales. Por ejemplo: "¿Cómo está el clima en Madrid?" o "Muéstrame el clima en 40.4168, -3.7038"',
    icon: '🤖'
  },
  {
    title: 'Clic en el Mapa 📍',
    description: 'Haz clic en cualquier punto del mapa para ver los datos meteorológicos de esa ubicación. Se mostrará un popup con temperatura, viento, humedad y más información.',
    icon: '🗺️'
  },
  {
    title: 'Selector de Capas 🎨',
    description: 'Usa el botón "Capas" en la esquina inferior derecha del mapa para cambiar entre diferentes mapas base (estándar, satélite, relieve) y activar capas meteorológicas.',
    icon: '🌤️'
  },
  {
    title: 'Capas Meteorológicas 🌡️',
    description: 'Activa capas como Temperatura, Viento, Nubes, Precipitación y Presión para visualizar datos climáticos sobre el mapa en tiempo real.',
    icon: '⛈️'
  },
  {
    title: '¡Listo para comenzar! ✨',
    description: 'Ya estás preparado para explorar el clima mundial. Recuerda que puedes reabrir este tutorial en cualquier momento haciendo clic en el botón de ayuda.',
    icon: '🚀'
  }
];

export function TutorialDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Verificar si es la primera visita
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    setIsOpen(false);
    setCurrentStep(0);
  };

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOpenTutorial = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  const currentStepData = tutorialSteps[currentStep];

  return (
    <>
      {/* Botón de ayuda flotante */}
      <button
        onClick={handleOpenTutorial}
        className="fixed bottom-4 left-4 z-[1000] bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all hover:scale-110"
        title="Ayuda"
      >
        <HelpCircle className="h-6 w-6" />
      </button>

      {/* Dialog del tutorial */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              {currentStepData.icon && <span className="text-3xl">{currentStepData.icon}</span>}
              {currentStepData.title}
            </DialogTitle>
            <DialogDescription className="text-base pt-4">
              {currentStepData.description}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center gap-2 py-4">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-blue-600'
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          <DialogFooter className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Paso {currentStep + 1} de {tutorialSteps.length}
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
              )}
              {currentStep < tutorialSteps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  className="flex items-center gap-1"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleClose}
                  className="bg-green-600 hover:bg-green-700"
                >
                  ¡Comenzar!
                </Button>
              )}
            </div>
          </DialogFooter>

          <button
            onClick={handleClose}
            className="text-xs text-gray-400 hover:text-gray-600 text-center mt-2"
          >
            Saltar tutorial
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}

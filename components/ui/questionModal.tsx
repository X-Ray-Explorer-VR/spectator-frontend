import { FC } from "react";

interface QuestionModalProps {
  question: string;
  response: string;
}

const QuestionModal: FC<QuestionModalProps> = ({ question, response }) => {
  return (
    <div className="absolute bottom-14 left-14 max-w-60">
      <div
        className={`text-white p-4 bg-gray-800 border rounded border-gray-700 min-w-[30vw] shadow-xl shadow-black/70 transition-opacity ${
          question ? "opacity-100" : "opacity-0"
        }`}
      >
        <h2 className="mb-1 text-xl font-bold pb-2">
          Pregunta realizada: {question}
        </h2>
        <p className="text-gray-400">
          {response.length > 0 ? response : "Esperando respuesta..."}
        </p>
      </div>
    </div>
  );
};

export default QuestionModal;

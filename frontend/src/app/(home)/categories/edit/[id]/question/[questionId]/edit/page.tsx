"use client";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useHeader } from "@/contexts/HeaderContext";
import QuestionFormContent from "@/components/category/QuestionFormContent";

export default function EditQuestionPage() {
  const params = useParams();
  const id = params.id as string; // categoryId
  const questionId = params.questionId as string;
  const { setHeader } = useHeader();

  // Set header title
  useEffect(() => {
    setHeader({ 
      title: "Edit Question", 
      backHref: `/categories/edit/${id}` 
    });
  }, [id, setHeader]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Main Content */}
      <main className="container mx-auto mt-2 px-4 py-6 max-w-4xl rounded-xl shadow-xl p-6 w-full bg-white">
        <QuestionFormContent categoryId={id} questionId={questionId} mode="edit" />
      </main>
    </div>
  );
}

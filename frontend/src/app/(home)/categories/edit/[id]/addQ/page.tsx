"use client";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useHeader } from "@/contexts/HeaderContext";
import QuestionFormContent from "@/components/category/QuestionFormContent";

export default function AddQuestionPage() {
  const params = useParams();
  const id = params.id as string; // categoryId
  const { setHeader } = useHeader();

  // Set header title
  useEffect(() => {
    setHeader({ 
      title: "Add Question", 
      backHref: `/categories/edit/${id}` 
    });
  }, [id, setHeader]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Main Content */}
      <main className="container mx-auto mt-2 px-4 py-6 max-w-4xl rounded-xl shadow-xl p-6 w-full bg-white">
        <QuestionFormContent categoryId={id} mode="add" />
      </main>
    </div>
  );
}


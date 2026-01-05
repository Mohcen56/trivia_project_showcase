"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gameAPI } from "@/lib/api";
import { logger } from '@/lib/utils/logger';
import { Mic, Video, Image as ImageIcon, Lock, X, Check } from "lucide-react";
import ImageCropModal from "@/components/utils/ImageCropModal";
import { useNotification } from '@/hooks/useNotification';
import { ShinyButton } from '@/components/ui/ShinyButton';

interface QuestionFormContentProps {
  categoryId: string | number;
  questionId?: string | number | null;
  mode: "add" | "edit";
}

export default function QuestionFormContent({ categoryId, questionId, mode }: QuestionFormContentProps) {
  const router = useRouter();
  const isEditMode = mode === "edit";

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [points, setPoints] = useState(200);
  const [loading, setLoading] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [error, setError] = useState("");
  const notify = useNotification();

  // Question image states
  const [questionImage, setQuestionImage] = useState<string | null>(null);
  const [questionImageFile, setQuestionImageFile] = useState<File | null>(null);
  const [tempQuestionImage, setTempQuestionImage] = useState<string | null>(null);

  // Answer image states
  const [answerImage, setAnswerImage] = useState<string | null>(null);
  const [answerImageFile, setAnswerImageFile] = useState<File | null>(null);
  const [tempAnswerImage, setTempAnswerImage] = useState<string | null>(null);

  const questionImageInputRef = useRef<HTMLInputElement>(null);
  const answerImageInputRef = useRef<HTMLInputElement>(null);

  // Handle question image selection - Open crop modal
  const handleQuestionImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setTempQuestionImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle cropped question image
  const handleQuestionCropComplete = (croppedFile: File) => {
    setQuestionImageFile(croppedFile);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setQuestionImage(ev.target?.result as string);
    };
    reader.readAsDataURL(croppedFile);
    setTempQuestionImage(null);
  };

  // Handle question crop cancel
  const handleQuestionCropCancel = () => {
    setTempQuestionImage(null);
    if (questionImageInputRef.current) {
      questionImageInputRef.current.value = '';
    }
  };

  // Handle answer image selection - Open crop modal
  const handleAnswerImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setTempAnswerImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle cropped answer image
  const handleAnswerCropComplete = (croppedFile: File) => {
    setAnswerImageFile(croppedFile);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAnswerImage(ev.target?.result as string);
    };
    reader.readAsDataURL(croppedFile);
    setTempAnswerImage(null);
  };

  // Handle answer crop cancel
  const handleAnswerCropCancel = () => {
    setTempAnswerImage(null);
    if (answerImageInputRef.current) {
      answerImageInputRef.current.value = '';
    }
  };

  // Remove question image
  const removeQuestionImage = () => {
    setQuestionImage(null);
    setQuestionImageFile(null);
    if (questionImageInputRef.current) {
      questionImageInputRef.current.value = '';
    }
  };

  // Remove answer image
  const removeAnswerImage = () => {
    setAnswerImage(null);
    setAnswerImageFile(null);
    if (answerImageInputRef.current) {
      answerImageInputRef.current.value = '';
    }
  };

  // Fetch question data when in edit mode
  useEffect(() => {
    if (isEditMode && questionId) {
      setLoadingQuestion(true);
      gameAPI.getQuestion(Number(questionId))
        .then((data) => {
          setQuestion(data.text || "");
          setAnswer(data.answer || "");
          setPoints(data.points || 200);

          // Set existing images if they exist
          if (data.image) {
            setQuestionImage(data.image);
          }
          if (data.answer_image) {
            setAnswerImage(data.answer_image);
          }
        })
        .catch((err) => {
          logger.exception(err, { where: 'QuestionFormContent.loadQuestion' });
          setError("Failed to load question data");
        })
        .finally(() => {
          setLoadingQuestion(false);
        });
    }
  }, [isEditMode, questionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();

      if (isEditMode) {
        // Edit mode: Use flat structure for PUT request
        formData.append("text", question);
        formData.append("answer", answer);
        formData.append("points", points.toString());
        formData.append("category", categoryId.toString());

        // Add images if uploaded
        if (questionImageFile) {
          formData.append("image", questionImageFile);
        }
        if (answerImageFile) {
          formData.append("answer_image", answerImageFile);
        }

        // Update existing question
        await gameAPI.updateQuestion(Number(questionId), formData);
      } else {
        // Add mode: Use nested structure for POST request
        formData.append("questions[0][text]", question);
        formData.append("questions[0][answer]", answer);
        formData.append("questions[0][points]", points.toString());

        // Add images if uploaded
        if (questionImageFile) {
          formData.append("questions[0][image]", questionImageFile);
        }
        if (answerImageFile) {
          formData.append("questions[0][answer_image]", answerImageFile);
        }

        // Create new question
        await gameAPI.addQuestionsToCategory(Number(categoryId), formData);
      }

      // Show success toast then navigate
      notify.success(
        isEditMode ? 'Question Updated' : 'Question Added',
        isEditMode ? 'The question has been updated successfully.' : 'The question has been added successfully.',
        3000
      );
      setTimeout(() => {
        router.push(`/categories/edit/${categoryId}`);
      }, 250);
    } catch (err) {
      logger.exception(err, { where: 'QuestionFormContent.saveQuestion', isEditMode });
      const errorObj = err as { detail?: string; message?: string; error?: string; errors?: unknown };
      setError(errorObj?.error || errorObj?.detail || errorObj?.message || `There was an error ${isEditMode ? 'updating' : 'adding'} the question`);
      notify.error(
        isEditMode ? 'Update Failed' : 'Create Failed',
        `Unable to ${isEditMode ? 'update' : 'create'} the question. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingQuestion) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Image Crop Modals */}
      {tempQuestionImage && (
        <ImageCropModal
          imageSrc={tempQuestionImage}
          onCropComplete={handleQuestionCropComplete}
          onCancel={handleQuestionCropCancel}
        />
      )}

      {tempAnswerImage && (
        <ImageCropModal
          imageSrc={tempAnswerImage}
          onCropComplete={handleAnswerCropComplete}
          onCancel={handleAnswerCropCancel}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
       

        {/* Question Section */}
        <div className="rounded-2xl p-6 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 shadow-md">
          <div className="space-y-4">
            <label className="block text-gray-900 text-sm font-semibold uppercase tracking-wide">
              Question
            </label>

            {/* Question Input */}
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base hover:border-blue-300 transition-colors"
              placeholder="write the question ..."
              rows={2}
              required
            />

            {/* Question Image Preview */}
            {questionImage && (
              <div className="relative w-full items-center justify-center max-w-50 mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={questionImage}
                  src={questionImage}
                  alt="Question preview"
                  className=" object-cover rounded-lg border-2 items-center justify-center border-blue-400"
                />
                <button
                  type="button"
                  onClick={removeQuestionImage}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Question Media Buttons */}
            <div className="flex gap-3 justify-center flex-wrap">
              {/* Audio Button */}
              <button
                type="button"
                className="relative flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-white border-3 border-amber-400 hover:bg-amber-50 transition-colors shadow-sm"
                title="add an audio"
              >
                <Mic className="h-7 w-7 text-gray-900 mb-1" />
                <span className="text-xs text-gray-900 font-bold">audio</span>
                <Lock className="absolute top-1 right-1 h-4 w-4 text-amber-500" />
              </button>

              {/* Video Button */}
              <button
                type="button"
                className="relative flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-white border-3 border-amber-400 hover:bg-amber-50 transition-colors shadow-sm"
                title="add a video"
              >
                <Video className="h-7 w-7 text-gray-900 mb-1" />
                <span className="text-xs text-gray-900 font-bold">video</span>
                <Lock className="absolute top-1 right-1 h-4 w-4 text-amber-500" />
              </button>

              {/* Image Button */}
              <button
                type="button"
                onClick={() => questionImageInputRef.current?.click()}
                className="relative flex flex-col items-center justify-center w-24 h-24 rounded-2xl  border-3 border-gray-300 hover:scale-105 transition-colors shadow-sm"
                title="add an image"
              >
                <ImageIcon className="h-7 w-7 text-gray-900 mb-1" />
                <span className="text-xs text-gray-900 font-bold">image</span>
                {questionImage && (
                  <Check className="absolute top-1 right-1 h-4 w-4 text-green-500 bg-white rounded-full" />
                )}
              </button>

              {/* Hidden file input for question image */}
              <input
                ref={questionImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQuestionImageSelect}
                aria-label="Upload question image"
              />
            </div>
          </div>
        </div>

        {/* Answer Section */}
        <div className="rounded-2xl p-6 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 shadow-md">
          <div className="space-y-4">
            <label className="block text-gray-900 text-sm font-semibold uppercase tracking-wide">
              Answer
            </label>

            {/* Answer Input */}
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base hover:border-blue-300 transition-colors"
              placeholder="write the answer here ..."
              rows={2}
              required
            />

            {/* Answer Image Preview */}
            {answerImage && (
              <div className="relative w-full max-w-50 mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={answerImage}
                  src={answerImage}
                  alt="Answer preview"
                  className=" object-cover rounded-lg border-2 border-green-400"
                />
                <button
                  type="button"
                  onClick={removeAnswerImage}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Answer Media Buttons */}
            <div className="flex gap-3 justify-center flex-wrap">
              {/* Audio Button */}
              <button
                type="button"
                className="relative flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-white border-3 border-amber-400 hover:bg-amber-50 transition-colors shadow-sm"
                title="add an audio"
              >
                <Mic className="h-7 w-7 text-gray-900 mb-1" />
                <span className="text-xs text-gray-900 font-bold">audio</span>
                <Lock className="absolute top-1 right-1 h-4 w-4 text-amber-500" />
              </button>

              {/* Video Button */}
              <button
                type="button"
                className="relative flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-white border-3 border-amber-400 hover:bg-amber-50 transition-colors shadow-sm"
                title="add a video"
              >
                <Video className="h-7 w-7 text-gray-900 mb-1" />
                <span className="text-xs text-gray-900 font-bold">video</span>
                <Lock className="absolute top-1 right-1 h-4 w-4 text-amber-500" />
              </button>

              {/* Image Button */}
              <button
                type="button"
                onClick={() => answerImageInputRef.current?.click()}
                className="relative flex flex-col items-center justify-center w-24 h-24 rounded-2xl  border-3 border-gray-300 hover:scale-105  transition-colors shadow-sm"
                title="add an image"
              >
                <ImageIcon className="h-7 w-7 text-gray-900 mb-1" />
                <span className="text-xs text-gray-900 font-bold">image</span>
                {answerImage && (
                  <Check className="absolute top-1 right-1 h-4 w-4 text-green-500 bg-white rounded-full" />
                )}
              </button>

              {/* Hidden file input for answer image */}
              <input
                ref={answerImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAnswerImageSelect}
                aria-label="Upload answer image"
              />
            </div>
          </div>
          
        </div>

        {/* Choose Points */}
        <div className="rounded-2xl p-6 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 shadow-md">
          <label className="block text-gray-900 text-sm font-semibold uppercase tracking-wide">
            Choose Points
          </label>
          <div className="mt-3 flex justify-center gap-3 flex-wrap">
            {[200, 400, 600].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPoints(p)}
                className={`rounded-xl font-bold text-base transition-all transform ${
                  points === p
                    ? 'bg-gradient-to-br from-cyan-700 to-cyan-800 text-white px-6 py-3 shadow-lg scale-105'
                    : 'bg-cyan-500 text-white px-6 py-3 hover:bg-cyan-600 hover:scale-105'
                }`}
              >
                {p} pts
              </button>
            ))}
          </div>
        </div>
        {error && (
          <div className="rounded-2xl p-5 bg-red-50 border-2 border-red-300 shadow-md">
            <p className="text-red-700 text-center font-medium">{error}</p>
          </div>
        )}

        {/* Submit / Cancel */}
        <div className="flex gap-4 pt-2">
          <ShinyButton
            type="submit"
            disabled={loading || loadingQuestion || !question.trim() || !answer.trim()}
            bgColor="bg-cyan-600"
            hoverColor="hover:bg-cyan-700"
            shadowColor="hover:shadow-cyan-500/30"
            className="flex-1"
          >
            {loading ? (isEditMode ? 'Updating…' : 'Saving…') : (isEditMode ? 'Update ' : 'Save ')}
          </ShinyButton>

          <ShinyButton
            type="button"
            onClick={() => router.push(`/categories/edit/${categoryId}`)}
            bgColor="bg-red-500"
            hoverColor="hover:bg-red-600"
            shadowColor="hover:shadow-red-500/30"
            className="flex-1"
          >
            Cancel
          </ShinyButton>
        </div>
      </form>
    </>
  );
}

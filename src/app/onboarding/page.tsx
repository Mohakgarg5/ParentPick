"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CONCERNS, SITUATIONS, CONTENT_PREFERENCES } from "@/lib/constants";

const STEPS = ["Child Info", "Concerns", "Situations", "Preferences"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [situations, setSituations] = useState<string[]>([]);
  const [contentPrefs, setContentPrefs] = useState<string[]>([]);

  const toggleItem = (
    list: string[],
    setList: (v: string[]) => void,
    item: string
  ) => {
    setList(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
    );
  };

  const handleNext = () => {
    if (step === 0 && (!childName || !childAge)) {
      setError("Please fill in your child's name and age");
      return;
    }
    setError("");
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childName, childAge, concerns, situations, contentPrefs }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return;
      }

      router.push("/discover");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF7ED] flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-teal-700">
            Let&apos;s personalize your experience
          </h1>
          <p className="text-slate-600 mt-2">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i <= step ? "bg-teal-500" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Child Info */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-800">
                Tell us about your child
              </h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Child&apos;s Name
                </label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., Emma"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Child&apos;s Age
                </label>
                <select
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select age</option>
                  <option value="1">1 year old</option>
                  <option value="2">2 years old</option>
                  <option value="3">3 years old</option>
                  <option value="4">4 years old</option>
                  <option value="5">5 years old</option>
                  <option value="6">6 years old</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Concerns */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-800">
                What are your screen time concerns?
              </h3>
              <p className="text-slate-500 text-sm">Select all that apply</p>
              <div className="space-y-2">
                {CONCERNS.map((concern) => (
                  <button
                    key={concern}
                    onClick={() => toggleItem(concerns, setConcerns, concern)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                      concerns.includes(concern)
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {concerns.includes(concern) ? "✓ " : ""}{concern}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Situations */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-800">
                When do you typically use screens?
              </h3>
              <p className="text-slate-500 text-sm">Select all that apply</p>
              <div className="space-y-2">
                {SITUATIONS.map((situation) => (
                  <button
                    key={situation}
                    onClick={() => toggleItem(situations, setSituations, situation)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                      situations.includes(situation)
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {situations.includes(situation) ? "✓ " : ""}{situation}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Content Preferences */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-800">
                What type of content interests you?
              </h3>
              <p className="text-slate-500 text-sm">Select all that apply</p>
              <div className="space-y-2">
                {CONTENT_PREFERENCES.map((pref) => (
                  <button
                    key={pref}
                    onClick={() => toggleItem(contentPrefs, setContentPrefs, pref)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                      contentPrefs.includes(pref)
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {contentPrefs.includes(pref) ? "✓ " : ""}{pref}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Setting up..." : "Get Started"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

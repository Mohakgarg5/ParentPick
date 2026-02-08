"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CONCERNS, SITUATIONS, CONTENT_PREFERENCES } from "@/lib/constants";

const STEPS = ["Children", "Concerns", "Situations", "Preferences"];

interface ChildEntry {
  name: string;
  dateOfBirth: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [children, setChildren] = useState<ChildEntry[]>([{ name: "", dateOfBirth: "" }]);
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

  const updateChild = (index: number, field: keyof ChildEntry, value: string) => {
    setChildren((prev) =>
      prev.map((child, i) => (i === index ? { ...child, [field]: value } : child))
    );
  };

  const addChild = () => {
    setChildren((prev) => [...prev, { name: "", dateOfBirth: "" }]);
  };

  const removeChild = (index: number) => {
    if (children.length <= 1) return;
    setChildren((prev) => prev.filter((_, i) => i !== index));
  };

  const getAge = (dob: string) => {
    if (!dob) return null;
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return Math.max(0, age);
  };

  const handleNext = () => {
    if (step === 0) {
      const valid = children.every((c) => c.name.trim() && c.dateOfBirth);
      if (!valid) {
        setError("Please fill in each child's name and date of birth");
        return;
      }
      const hasOutOfRange = children.some((c) => {
        const age = getAge(c.dateOfBirth);
        return age === null || age < 0 || age > 12;
      });
      if (hasOutOfRange) {
        setError("Please enter a valid date of birth");
        return;
      }
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
        body: JSON.stringify({ children, concerns, situations, contentPrefs }),
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

  // Max date = today, min date = 12 years ago
  const today = new Date().toISOString().split("T")[0];
  const minDate = new Date(new Date().setFullYear(new Date().getFullYear() - 12)).toISOString().split("T")[0];

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

          {/* Step 1: Children Info */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-800">
                Tell us about your kids
              </h3>
              <p className="text-sm text-slate-500">
                Add each child so we can recommend age-appropriate content.
              </p>

              {children.map((child, index) => {
                const age = getAge(child.dateOfBirth);
                return (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">
                        Child {index + 1}
                      </span>
                      {children.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChild(index)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={child.name}
                        onChange={(e) => updateChild(index, "name", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="e.g., Emma"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={child.dateOfBirth}
                        onChange={(e) => updateChild(index, "dateOfBirth", e.target.value)}
                        min={minDate}
                        max={today}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      {age !== null && (
                        <p className="text-xs text-teal-600 mt-1">
                          {age === 0 ? "Under 1 year old" : `${age} year${age !== 1 ? "s" : ""} old`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addChild}
                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-500 hover:border-teal-300 hover:text-teal-600 transition-colors"
              >
                + Add Another Child
              </button>
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

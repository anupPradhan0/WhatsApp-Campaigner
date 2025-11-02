import { useState } from "react";
import ReactQuill from "react-quill-new";
import type { FormEvent, ChangeEvent } from "react";
import "react-quill-new/dist/quill.snow.css";

interface FormData {
  campaignName: string;
  message: string;
  phoneButtonText: string;
  phoneButtonNumber: string;
  linkButtonText: string;
  linkButtonUrl: string;
  mobileNumberEntryType: string;
  mobileNumbers: string;
  countryCode: string;
  numberCount: string;
}

const SendWhatsapp = () => {
  const [formData, setFormData] = useState<FormData>({
    campaignName: "",
    message: "",
    phoneButtonText: "",
    phoneButtonNumber: "",
    linkButtonText: "",
    linkButtonUrl: "",
    mobileNumberEntryType: "manual",
    mobileNumbers: "",
    countryCode: "+91",
    numberCount: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"image" | "video" | "pdf" | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fileUploadError, setFileUploadError] = useState("");
  const [mobileNumberError, setMobileNumberError] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");

  // Rich text editor configuration
  const modules = {
    toolbar: [
      ["bold", "italic"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote"],
      ["link"],
    ],
  };

  const formats = ["bold", "italic", "list", "blockquote", "link"];

  // Handle text input changes
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle rich text editor change
  const handleMessageChange = (content: string) => {
    setFormData((prev) => ({
      ...prev,
      message: content,
    }));
  };

  // Handle file upload
  const handleFileUpload = (
    e: ChangeEvent<HTMLInputElement>,
    type: "image" | "video" | "pdf"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setFileUploadError("File size exceeds 5MB limit");
      return;
    }

    // Validate file type
    const validTypes: Record<string, string[]> = {
      image: ["image/png", "image/jpeg", "image/jpg", "image/gif"],
      video: ["video/mp4"],
      pdf: ["application/pdf"],
    };

    if (!validTypes[type].includes(file.type)) {
      setFileUploadError(`Invalid ${type} file type`);
      return;
    }

    setSelectedFile(file);
    setFileType(type);
    setFileUploadError("");
  };

  const handleMobileNumberChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    const validPattern = /^[0-9+,\s\n\r]*$/;

    if (!validPattern.test(value)) {
      setMobileNumberError(
        "Only numbers, +, commas, spaces, and line breaks are allowed"
      );
    } else {
      setMobileNumberError("");
    }

    setFormData((prev) => ({
      ...prev,
      mobileNumbers: value,
    }));
  };

  const countMobileNumbers = (): number => {
    if (!formData.mobileNumbers.trim()) return 0;

    const numbers = formData.mobileNumbers
      .split(/[\n,]/)
      .map((num) => num.trim())
      .filter((num) => num.length > 0);

    return numbers.length;
  };

  // Handle phone number input with validation (only numbers and spaces)
  const handlePhoneNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const validPattern = /^[0-9\s+]*$/;

    if (!validPattern.test(value)) {
      setPhoneNumberError("Only numbers and spaces and plus sign are allowed");
    } else {
      setPhoneNumberError("");
    }

    setFormData((prev) => ({
      ...prev,
      phoneButtonNumber: value,
    }));
  };

  // Clear selected file
  const clearFile = () => {
    setSelectedFile(null);
    setFileType(null);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validation
    if (
      !formData.campaignName ||
      !formData.message ||
      !formData.mobileNumbers
    ) {
      setError("Campaign name, message, and mobile numbers are required");
      setLoading(false);
      return;
    }

    try {
      // Create FormData for multipart/form-data
      const submitData = new FormData();

      // Append form fields
      submitData.append("campaignName", formData.campaignName);
      submitData.append("message", formData.message);
      submitData.append(
        "mobileNumberEntryType",
        formData.mobileNumberEntryType
      );
      submitData.append("mobileNumbers", formData.mobileNumbers);
      submitData.append("countryCode", formData.countryCode);

      // Append optional fields
      if (formData.phoneButtonText && formData.phoneButtonNumber) {
        submitData.append("phoneButtonText", formData.phoneButtonText);
        submitData.append("phoneButtonNumber", formData.phoneButtonNumber);
      }

      if (formData.linkButtonText && formData.linkButtonUrl) {
        submitData.append("linkButtonText", formData.linkButtonText);
        submitData.append("linkButtonUrl", formData.linkButtonUrl);
      }

      // Append file if selected
      if (selectedFile) {
        submitData.append("image", selectedFile);
      }

      // Send to backend
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/api/campaigns`, {
        method: "POST",
        body: submitData,
        credentials: "include",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess("Campaign created successfully!");
        // Reset form
        setFormData({
          campaignName: "",
          message: "",
          phoneButtonText: "",
          phoneButtonNumber: "",
          linkButtonText: "",
          linkButtonUrl: "",
          mobileNumberEntryType: "manual",
          mobileNumbers: "",
          countryCode: "+91",
          numberCount: "",
        });
        setSelectedFile(null);
        setFileType(null);
      } else {
        // 👇 This part improved:
        const backendError =
          result.errors?.[0] || // show the first validation message
          result.message || // else fallback to general message
          "Failed to create campaign";

        setError(backendError);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Success Popup - Fixed Position */}
      {success && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-slideIn">
          <div className="p-3 sm:p-4 bg-green-500/90 backdrop-blur-md rounded-lg sm:rounded-xl border border-white/50 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <p className="text-white font-semibold text-sm sm:text-base flex-1">
                {success}
              </p>
              <button
                onClick={() => setSuccess("")}
                className="text-white hover:text-gray-200 transition-colors flex-shrink-0"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Popup - Fixed Position */}
      {error && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-slideIn">
          <div className="p-3 sm:p-4 bg-red-500/90 backdrop-blur-md rounded-lg sm:rounded-xl border border-red-300 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <p className="text-white font-semibold text-sm sm:text-base flex-1">
                {error}
              </p>
              <button
                onClick={() => setError("")}
                className="text-white hover:text-gray-200 transition-colors flex-shrink-0"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header - Mobile Responsive */}
      <div className="p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-black">
          SEND NEW CAMPAIGN
        </h2>
      </div>

      {/* Main Form - Mobile Responsive */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Campaign Name */}
        <div className="p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
          <label className="block text-xs sm:text-sm font-bold text-black mb-2 uppercase">
            Campaign Name *
          </label>
          <input
            type="text"
            name="campaignName"
            value={formData.campaignName}
            onChange={handleInputChange}
            placeholder="Enter campaign name"
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-sm sm:text-base text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
            disabled={loading}
          />
        </div>

        {/* Message - Rich Text Editor */}
        <div className="p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
          <label className="block text-xs sm:text-sm font-bold text-black mb-2 uppercase">
            Message *
          </label>
          <div className="bg-white/80 rounded-lg sm:rounded-xl overflow-hidden">
            <ReactQuill
              theme="snow"
              value={formData.message}
              onChange={handleMessageChange}
              modules={modules}
              formats={formats}
              placeholder="Enter your message..."
              className="text-black text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Phone Button - Mobile Stacked */}
        <div className="p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
          <label className="block text-xs sm:text-sm font-bold text-black mb-3 sm:mb-4 uppercase">
            Phone number on Button :
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <input
              type="text"
              name="phoneButtonText"
              value={formData.phoneButtonText}
              onChange={handleInputChange}
              placeholder="Call Now Write Button Text"
              className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-sm sm:text-base text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              disabled={loading}
            />
            <input
              type="tel"
              name="phoneButtonNumber"
              value={formData.phoneButtonNumber}
              onChange={handlePhoneNumberChange}
              placeholder="Phone Number"
              className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-sm sm:text-base text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              disabled={loading}
            />
          </div>

          {phoneNumberError && (
            <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-slideIn">
              <div className="p-3 sm:p-4 bg-red-500/90 backdrop-blur-md rounded-lg sm:rounded-xl border border-red-300 shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-white font-semibold text-sm sm:text-base flex-1">
                    {phoneNumberError}
                  </p>
                  <button
                    onClick={() => {
                      setPhoneNumberError("");
                    }}
                    className="text-white hover:text-gray-200 transition-colors flex-shrink-0"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Link Button - Mobile Stacked */}
        <div className="p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
          <label className="block text-xs sm:text-sm font-bold text-black mb-3 sm:mb-4 uppercase">
            Link on Button :
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <input
              type="text"
              name="linkButtonText"
              value={formData.linkButtonText}
              onChange={handleInputChange}
              placeholder="Visit Website Button Text"
              className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-sm sm:text-base text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              disabled={loading}
            />
            <input
              type="url"
              name="linkButtonUrl"
              value={formData.linkButtonUrl}
              onChange={handleInputChange}
              placeholder="URL"
              className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-sm sm:text-base text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              disabled={loading}
            />
          </div>
        </div>

        {/* File Uploads - Mobile Optimized */}
        <div className="p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
          <label className="block text-xs sm:text-sm font-bold text-black mb-3 sm:mb-4 uppercase">
            Upload Media (Select Only One){" "}
            <span className="text-red-600 text-[10px] sm:text-xs">
              (MAX 5MB)
            </span>
          </label>

          {selectedFile && (
            <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-green-500/20 backdrop-blur-sm rounded-lg sm:rounded-xl border border-green-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="text-black font-semibold text-xs sm:text-sm break-all">
                {selectedFile.name} (
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
              <button
                type="button"
                onClick={clearFile}
                className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500/60 backdrop-blur-md text-white text-sm font-semibold rounded-lg hover:bg-red-600/60 transition-all active:scale-95"
              >
                Remove
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Image Upload */}
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-black mb-2">
                IMAGE{" "}
                <span className="text-red-600 block sm:inline">
                  (JPG, PNG, GIF)
                </span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "image")}
                disabled={
                  loading || (selectedFile !== null && fileType !== "image")
                }
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-xs sm:text-sm text-black file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:bg-green-500/60 file:text-white file:text-xs sm:file:text-sm file:font-semibold hover:file:bg-green-600/60 focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* Video Upload */}
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-black mb-2">
                VIDEO
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleFileUpload(e, "video")}
                // disabled={
                //   loading || (selectedFile !== null && fileType !== "video")
                // }
                disabled={true}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-xs sm:text-sm text-black file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:bg-green-500/60 file:text-white file:text-xs sm:file:text-sm file:font-semibold hover:file:bg-green-600/60 focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* PDF Upload */}
            <div className="md:col-span-2">
              <label className="block text-[10px] sm:text-xs font-bold text-black mb-2">
                UPLOAD PDF
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => handleFileUpload(e, "pdf")}
                // disabled={
                //   loading || (selectedFile !== null && fileType !== "pdf")
                // }
                disabled={true}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-xs sm:text-sm text-black file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:bg-green-500/60 file:text-white file:text-xs sm:file:text-sm file:font-semibold hover:file:bg-green-600/60 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* File Upload Error - Shows as popup */}
          {fileUploadError && (
            <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-slideIn">
              <div className="p-3 sm:p-4 bg-red-500/90 backdrop-blur-md rounded-lg sm:rounded-xl border border-red-300 shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-white font-semibold text-sm sm:text-base flex-1">
                    {fileUploadError}
                  </p>
                  <button
                    onClick={() => {
                      setFileUploadError("");
                    }}
                    className="text-white hover:text-gray-200 transition-colors flex-shrink-0"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Number Entry Type */}
        <div className="p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
          <label className="block text-xs sm:text-sm font-bold text-black mb-2 uppercase">
            Mobile Number Enter Type *
          </label>
          <select
            name="mobileNumberEntryType"
            value={formData.mobileNumberEntryType}
            onChange={handleInputChange}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-sm sm:text-base text-black focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
            disabled={loading}
          >
            <option value="Manual Entry">Manual Entry</option>
            <option value="CSV Upload">CSV Upload</option>
            <option value="Contact List">Contact List</option>
          </select>
        </div>

        {/* Mobile Numbers - Responsive Textarea */}
        <div className="p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
          <label className="block text-xs sm:text-sm font-bold text-black mb-2 uppercase">
            Mobile Numbers *
          </label>
          <textarea
            name="mobileNumbers"
            value={formData.mobileNumbers}
            onChange={handleMobileNumberChange}
            placeholder="Enter mobile numbers (comma-separated)"
            rows={4}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-sm sm:text-base text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
            disabled={loading}
          />
          {mobileNumberError && (
            <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-slideIn">
              <div className="p-3 sm:p-4 bg-red-500/90 backdrop-blur-md rounded-lg sm:rounded-xl border border-red-300 shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-white font-semibold text-sm sm:text-base flex-1">
                    {mobileNumberError}
                  </p>
                  <button
                    onClick={() => {
                      setMobileNumberError("");
                    }}
                    className="text-white hover:text-gray-200 transition-colors flex-shrink-0"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Number Count */}
        <div className="p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
          <label className="block text-xs sm:text-sm font-bold text-black mb-2 uppercase">
            Number Count
          </label>
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-sm sm:text-base text-black font-semibold">
            {countMobileNumbers()}{" "}
            {countMobileNumbers() === 1 ? "number" : "numbers"}
          </div>
        </div>

        {/* Number Count */}
        {/* <div className="p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
          <label className="block text-xs sm:text-sm font-bold text-black mb-2 uppercase">
            Number Count *
          </label>
          <input
            type="text"
            name="numberCount"
            value={formData.numberCount}
            onChange={handleInputChange}
            placeholder="Enter number count"
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-sm sm:text-base text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
            disabled={loading}
          />
        </div> */}

        {/* Submit Button - Full Width on Mobile */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 bg-green-500/80 backdrop-blur-md text-white font-bold text-base sm:text-lg rounded-lg sm:rounded-xl border border-white/30 shadow-lg hover:bg-green-600/80 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>

      {/* Loading Screen - Clean Center Popup */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="w-full max-w-sm sm:max-w-md p-6 sm:p-8 bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col items-center gap-6 sm:gap-8">
            {/* Loading Spinner */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"></div>
            </div>

            {/* Loading Text */}
            <div className="text-center">
              <p className="text-lg sm:text-xl font-bold text-black">
                Creating Campaign
              </p>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                Please wait...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal - Clean Center Popup */}
      {success && !loading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm sm:max-w-md p-6 sm:p-8 bg-white rounded-2xl sm:rounded-3xl shadow-2xl">
            {/* Success Icon */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            {/* Success Title */}
            <h3 className="text-xl sm:text-2xl font-bold text-black text-center mb-2">
              Success!
            </h3>

            {/* Success Message */}
            <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">
              {success}
            </p>

            {/* Close Button */}
            <button
              onClick={() => setSuccess("")}
              className="w-full px-6 py-3 bg-green-500 text-white font-bold text-base rounded-lg hover:bg-green-600 transition-all active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <style>{`
              @keyframes slideIn {
                from {
                  transform: translateX(100%);
                  opacity: 0;
                }
                to {
                  transform: translateX(0);
                  opacity: 1;
                }
              }

              .animate-slideIn {
                animation: slideIn 0.3s ease-out forwards;
              }
      `}</style>

      <style>{`
              @keyframes slideIn {
                from {
                  transform: translateX(100%);
                  opacity: 0;
                }
                to {
                  transform: translateX(0);
                  opacity: 1;
                }
              }

              .animate-slideIn {
                animation: slideIn 0.3s ease-out forwards;
              }
      `}</style>
    </div>
  );
};

export default SendWhatsapp;

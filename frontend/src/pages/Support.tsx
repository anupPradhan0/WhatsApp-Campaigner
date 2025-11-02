import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  User,
  Shield,
  HelpCircle,
  MessageSquare,
  ExternalLink,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface CreatorData {
  companyName: string;
  email: string;
  number: string;
  role: string;
  status: string;
  image?: string;
}

const Support = () => {
  const navigate = useNavigate();
  const [creatorData, setCreatorData] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Support Form States
  const [supportForm, setSupportForm] = useState({
    name: "",
    email: "",
    number: "",
    subject: "",
    message: "",
  });
  const [submittingForm, setSubmittingForm] = useState(false);
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch creator/support data
  useEffect(() => {
    const fetchSupportData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/dashboard/support`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setCreatorData(result.data);
        } else {
          setError(result.message || "Failed to load support information");
        }
      } catch (err) {
        setError("Network error. Please try again.");
        console.error("Support fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSupportData();
  }, [API_URL]);

  // Handle Support Form Change
  const handleSupportFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setSupportForm({
      ...supportForm,
      [e.target.name]: e.target.value,
    });
  };

  // Handle Support Form Submit
  const handleSupportFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingForm(true);
    setFormSuccess("");
    setFormError("");

    try {
      const response = await fetch(`${API_URL}/api/support`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(supportForm),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setFormSuccess(
          result.message ||
            "Your message has been sent successfully! We will get back to you soon."
        );
        setSupportForm({
          name: "",
          email: "",
          number: "",
          subject: "",
          message: "",
        });
      } else {
        setFormError(
          result.message || "Failed to send message. Please try again."
        );
      }
    } catch (err) {
      setFormError(
        "Network error. Please check your connection and try again."
      );
      console.error("Support form error:", err);
    } finally {
      setSubmittingForm(false);
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const badges = {
      active: "bg-green-500",
      inactive: "bg-red-500",
      deleted: "bg-gray-500",
    };
    return badges[status.toLowerCase() as keyof typeof badges] || "bg-gray-500";
  };

  // Get role badge color
  const getRoleBadge = (role: string) => {
    const badges = {
      admin: "bg-purple-500",
      reseller: "bg-blue-500",
      user: "bg-green-500",
    };
    return badges[role.toLowerCase() as keyof typeof badges] || "bg-gray-500";
  };

  // Navigate to complaints page
  const goToComplaints = () => {
    navigate("/complaints");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="p-6 sm:p-8 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl max-w-md w-full">
          <p className="text-lg sm:text-xl font-semibold text-black text-center">
            Loading Support Information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-0">
      {/* Page Header */}
      <div className="p-4 sm:p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-3 bg-green-500 rounded-xl flex-shrink-0">
            <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-black truncate">
              Support & Help
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Get assistance from your creator or platform support
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 sm:p-4 bg-red-100/60 backdrop-blur-md rounded-xl border border-red-300 shadow-lg">
          <p className="text-sm sm:text-base text-red-700 font-semibold break-words">
            {error}
          </p>
        </div>
      )}

      {/* Section 1: Creator/Reseller Contact */}
      {creatorData && (
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/80 shadow-xl p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-2 sm:p-3 bg-blue-500 rounded-xl flex-shrink-0">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-black">
              Your Creator/Account Manager
            </h3>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl sm:rounded-2xl border-2 border-blue-300 shadow-lg p-4 sm:p-6">
            <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
              {/* Creator Image */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                {creatorData.image ? (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-blue-500 shadow-xl">
                    <img
                      src={creatorData.image}
                      alt={creatorData.companyName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement!.innerHTML = `
                          <div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold">
                            ${creatorData.companyName.charAt(0)}
                          </div>
                        `;
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-4xl sm:text-5xl font-bold shadow-xl border-4 border-blue-500">
                    {creatorData.companyName.charAt(0)}
                  </div>
                )}
              </div>

              {/* Creator Details */}
              <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                {/* Name and Badges */}
                <div className="text-center md:text-left">
                  <h4 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 break-words">
                    {creatorData.companyName}
                  </h4>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <span
                      className={`px-2.5 sm:px-3 py-1 ${getRoleBadge(
                        creatorData.role
                      )} text-white text-xs font-bold rounded-full uppercase shadow-sm`}
                    >
                      {creatorData.role}
                    </span>
                    <span
                      className={`px-2.5 sm:px-3 py-1 ${getStatusBadge(
                        creatorData.status
                      )} text-white text-xs font-bold rounded-full uppercase shadow-sm`}
                    >
                      {creatorData.status}
                    </span>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-2 sm:space-y-3">
                  {/* Email */}
                  <a
                    href={`mailto:${creatorData.email}`}
                    className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-white/80 rounded-xl hover:bg-white transition-all border-2 border-blue-200 shadow-sm group"
                  >
                    <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-all flex-shrink-0">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-bold uppercase">
                        Email
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                        {creatorData.email}
                      </p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-blue-600 transition-all flex-shrink-0" />
                  </a>

                  {/* Phone */}
                  <a
                    href={`tel:${creatorData.number}`}
                    className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-white/80 rounded-xl hover:bg-white transition-all border-2 border-green-200 shadow-sm group"
                  >
                    <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-all flex-shrink-0">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-bold uppercase">
                        Phone
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-gray-800">
                        {creatorData.number}
                      </p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-green-600 transition-all flex-shrink-0" />
                  </a>
                </div>

                {/* Instructions */}
                <div className="bg-blue-100 border-l-4 border-blue-500 p-3 sm:p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-blue-800 mb-1">
                        Need Help?
                      </p>
                      <p className="text-xs text-gray-700 leading-relaxed break-words">
                        Contact your {creatorData.role.toLowerCase()} for
                        account-related queries, credits, campaign issues, or
                        any assistance with the platform.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Platform Support */}
      <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/80 shadow-xl p-4 sm:p-6 md:p-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="p-2 sm:p-3 bg-purple-500 rounded-xl flex-shrink-0">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-black">
            Platform Support
          </h3>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl border-2 border-purple-300 shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Support Contact Info */}
          <div>
            <h4 className="text-base sm:text-lg font-bold text-purple-800 mb-3 sm:mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Contact Platform Support</span>
            </h4>

            <div className="space-y-2 sm:space-y-3">
              {/* Platform Email */}
              <a
                href="mailto:hello@prominds.digital"
                className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white rounded-xl hover:bg-gray-50 transition-all border-2 border-purple-200 shadow-sm group"
              >
                <div className="p-2 sm:p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-all flex-shrink-0">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-bold uppercase">
                    Platform Email
                  </p>
                  <p className="text-sm sm:text-base font-bold text-gray-800 truncate">
                    hello@prominds.digital
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">
                    For technical and platform-related issues
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-purple-600 transition-all flex-shrink-0" />
              </a>

              {/* Platform Phone */}
              <a
                href="tel:+919876543210"
                className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white rounded-xl hover:bg-gray-50 transition-all border-2 border-green-200 shadow-sm group"
              >
                <div className="p-2 sm:p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-all flex-shrink-0">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-bold uppercase">
                    Support Hotline
                  </p>
                  <p className="text-sm sm:text-base font-bold text-gray-800">
                    +91 98765 43210
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">
                    Available Mon-Sat, 9 AM - 6 PM
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-green-600 transition-all flex-shrink-0" />
              </a>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-purple-200"></div>

          {/* Submit Complaint Section */}
          <div>
            <h4 className="text-base sm:text-lg font-bold text-purple-800 mb-3 sm:mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Submit a Complaint</span>
            </h4>

            <div className="bg-white rounded-xl p-4 sm:p-5 border-2 border-purple-200 space-y-3 sm:space-y-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-bold text-gray-800 mb-1">
                    File a Formal Complaint
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                    For issues requiring formal documentation and tracking, you
                    can submit a complaint through our complaints system. Your
                    complaint will be reviewed by the admin team and you'll
                    receive updates on its status.
                  </p>
                  <button
                    onClick={goToComplaints}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 bg-green-500/80 backdrop-blur-md text-white text-sm sm:text-base font-bold rounded-xl hover:bg-green-600/80 transition-all shadow-lg border border-white/30"
                  >
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span>Go to Complaints Page</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-purple-100 border-l-4 border-purple-500 p-3 sm:p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-purple-800 mb-1">
                  When to Contact Platform Support?
                </p>
                <ul className="text-xs text-gray-700 leading-relaxed space-y-0.5 sm:space-y-1 ml-3 sm:ml-4 list-disc">
                  <li>Technical issues with the platform</li>
                  <li>Login or authentication problems</li>
                  <li>Bug reports or feature requests</li>
                  <li>
                    Issues not resolved by your{" "}
                    {creatorData?.role.toLowerCase()}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Help Tips */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-300 shadow-xl p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="p-1.5 sm:p-2 bg-yellow-500 rounded-lg flex-shrink-0">
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-yellow-800">
            Quick Help Tips
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl p-3 sm:p-4 border-2 border-yellow-200">
            <p className="text-sm sm:text-base font-bold text-gray-800 mb-1.5 sm:mb-2 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
              <span>Account & Credits</span>
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Contact your {creatorData?.role.toLowerCase() || "creator"} for
              balance, credits, or account status issues.
            </p>
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-4 border-2 border-yellow-200">
            <p className="text-sm sm:text-base font-bold text-gray-800 mb-1.5 sm:mb-2 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
              <span>Technical Issues</span>
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Reach out to platform support for bugs, errors, or technical
              problems.
            </p>
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-4 border-2 border-yellow-200">
            <p className="text-sm sm:text-base font-bold text-gray-800 mb-1.5 sm:mb-2 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
              <span>Campaign Help</span>
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Check the Documentation page for guides on creating and managing
              campaigns.
            </p>
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-4 border-2 border-yellow-200">
            <p className="text-sm sm:text-base font-bold text-gray-800 mb-1.5 sm:mb-2 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
              <span>Formal Complaints</span>
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Use the Complaints section (Others menu) for issues requiring
              formal tracking.
            </p>
          </div>
        </div>
      </div>

      {/* NEW SECTION: Contact Support Form */}
      <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/80 shadow-xl p-4 sm:p-6 md:p-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="p-2 sm:p-3 bg-green-500 rounded-xl flex-shrink-0">
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-black">
            Send Support Request
          </h3>
        </div>

        <form onSubmit={handleSupportFormSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-black mb-2 uppercase">
              Your Name *
            </label>
            <input
              type="text"
              name="name"
              value={supportForm.name}
              onChange={handleSupportFormChange}
              placeholder="Enter your full name"
              required
              disabled={submittingForm}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-sm sm:text-base text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all disabled:opacity-50"
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-black mb-2 uppercase">
              Your Email *
            </label>
            <input
              type="email"
              name="email"
              value={supportForm.email}
              onChange={handleSupportFormChange}
              placeholder="your.email@example.com"
              required
              disabled={submittingForm}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-sm sm:text-base text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all disabled:opacity-50"
            />
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-black mb-2 uppercase">
              Phone Number *
            </label>
            <input
              type="tel"
              name="number"
              value={supportForm.number}
              onChange={handleSupportFormChange}
              placeholder="Enter your phone number"
              required
              disabled={submittingForm}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-sm sm:text-base text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all disabled:opacity-50"
            />
          </div>

          {/* Subject Field */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-black mb-2 uppercase">
              Subject *
            </label>
            <input
              type="text"
              name="subject"
              value={supportForm.subject}
              onChange={handleSupportFormChange}
              placeholder="Brief subject of your request"
              required
              disabled={submittingForm}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-sm sm:text-base text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all disabled:opacity-50"
            />
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-black mb-2 uppercase">
              Message *
            </label>
            <textarea
              name="message"
              value={supportForm.message}
              onChange={handleSupportFormChange}
              placeholder="Describe your issue or question in detail..."
              rows={5}
              required
              disabled={submittingForm}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-sm sm:text-base text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all resize-none disabled:opacity-50"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submittingForm}
            className="w-full px-6 py-3 bg-green-500/80 backdrop-blur-md text-white font-bold text-base rounded-xl hover:bg-green-600/80 transition-all shadow-lg border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
          >
            {submittingForm ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-5 h-5" />
                <span>Send Support Request</span>
              </>
            )}
          </button>
        </form>

        {/* Success/Error Messages */}
        {formSuccess && (
          <div className="mt-4 p-3 sm:p-4 bg-green-100 border-2 border-green-500 rounded-xl flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-800 font-semibold">
              {formSuccess}
            </p>
          </div>
        )}

        {formError && (
          <div className="mt-4 p-3 sm:p-4 bg-red-100 border-2 border-red-500 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800 font-semibold">{formError}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Support;

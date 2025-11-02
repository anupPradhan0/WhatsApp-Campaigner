import { useState, useEffect } from 'react';
import {
    Book,
    Rocket,
    Sparkles,
    MessageSquare,
    Users,
    Download,
    Calendar,
    Shield,
    FileText,
    Mail,
    Github,
    Linkedin,
    Globe,
    Menu,
    X,
    CheckCircle,
    Image,
    Send,
    BarChart3,
    HelpCircle,
    User,
    Settings,
    Database,
    Filter,
    Eye,
    Upload
} from 'lucide-react';


const navItems = [
    { id: 'getting-started', label: 'Getting Started', icon: Rocket },
    { id: 'features', label: 'Features', icon: Sparkles },
    { id: 'how-to-use', label: 'How to Use', icon: Book },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'about', label: 'About Creator', icon: User },
];


const Documentation = () => {
    const [activeSection, setActiveSection] = useState('getting-started');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


    // Scroll to section and update active state
    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveSection(sectionId);
            setIsMobileMenuOpen(false);
        }
    };


    // Handle scroll to update active section
    useEffect(() => {
        const handleScroll = () => {
            const sections = navItems.map(item => item.id);
            const scrollPosition = window.scrollY + 100;


            for (const sectionId of sections) {
                const element = document.getElementById(sectionId);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(sectionId);
                        break;
                    }
                }
            }
        };


        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);


    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
            {/* Hero Section - Fully Responsive */}
            <div className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-white py-12 sm:py-16 md:py-20 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-block mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-md rounded-full text-xs sm:text-sm font-bold">
                        v1.0.0 - Production Ready
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight px-2">
                        WhatsApp Campaign Manager
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-white/90 px-2">
                        Your complete solution for bulk WhatsApp marketing campaigns with advanced tracking and analytics
                    </p>
                    <button
                        onClick={() => scrollToSection('getting-started')}
                        className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-green-600 font-bold text-base sm:text-lg rounded-xl shadow-xl hover:bg-gray-100 transition-all transform hover:scale-105"
                    >
                        Get Started →
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 gap-6 sm:gap-8">
                {/* Sidebar Navigation - Responsive */}
                <aside className="w-full lg:w-64 lg:sticky lg:top-8 lg:self-start">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="lg:hidden w-full mb-4 p-3 sm:p-4 bg-white/60 backdrop-blur-lg rounded-xl border border-white/80 shadow-lg flex items-center justify-between font-bold text-black"
                    >
                        <span className="text-sm sm:text-base">Navigation</span>
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>


                    {/* Navigation Menu */}
                    <nav
                        className={`${
                            isMobileMenuOpen ? 'block' : 'hidden'
                        } lg:block bg-white/60 backdrop-blur-lg rounded-2xl border border-white/80 shadow-xl p-3 sm:p-4 space-y-2`}
                    >
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => scrollToSection(item.id)}
                                    className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all ${
                                        activeSection === item.id
                                            ? 'bg-green-500 text-white shadow-lg'
                                            : 'text-gray-700 hover:bg-white/80'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                                    <span className="truncate">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>


                    {/* Quick Links Card - Hidden on Mobile */}
                    <div className="hidden lg:block mt-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl border-2 border-purple-300 shadow-xl p-6">
                        <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            Quick Links
                        </h3>
                        <div className="space-y-2">
                            <a
                                href="https://github.com/M0rs-Ruki/WhatsApp-Campaigner"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block px-3 py-2 bg-white/60 rounded-lg text-sm font-semibold text-purple-700 hover:bg-white transition-all"
                            >
                                📦 GitHub Repository
                            </a>
                            <a
                                href="/support"
                                className="block px-3 py-2 bg-white/60 rounded-lg text-sm font-semibold text-purple-700 hover:bg-white transition-all"
                            >
                                ✉️ Email Support
                            </a>
                        </div>
                    </div>
                </aside>


                {/* Main Content - Responsive */}
                <main className="flex-1 space-y-8 sm:space-y-10 lg:space-y-12 w-full min-w-0">
                    {/* Getting Started Section */}
                    <section id="getting-started" className="scroll-mt-8">
                        <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/80 shadow-xl p-4 sm:p-6 md:p-8">
                            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                                <div className="p-2 sm:p-3 bg-green-500 rounded-xl flex-shrink-0">
                                    <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-black">Getting Started</h2>
                            </div>


                            <div className="space-y-4 sm:space-y-6">
                                {/* What is it? */}
                                <div>
                                    <h3 className="text-lg sm:text-xl font-bold text-black mb-2 sm:mb-3 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                                        <span>What is WhatsApp Campaign Manager?</span>
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                                        WhatsApp Campaign Manager is a comprehensive marketing platform that enables businesses to create, manage, and track WhatsApp marketing campaigns at scale. Send bulk messages with media attachments, track campaign performance, and manage customer interactions—all from one intuitive dashboard.
                                    </p>
                                </div>


                                {/* Who is it for? */}
                                <div className="bg-blue-50 rounded-xl p-4 sm:p-6 border-2 border-blue-200">
                                    <h3 className="text-lg sm:text-xl font-bold text-blue-800 mb-2 sm:mb-3 flex items-center gap-2">
                                        <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                                        <span>Who is it for?</span>
                                    </h3>
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2 text-sm sm:text-base text-gray-700">
                                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                            <span><strong>Marketing Teams:</strong> Run campaigns efficiently with bulk messaging</span>
                                        </li>
                                        <li className="flex items-start gap-2 text-sm sm:text-base text-gray-700">
                                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                            <span><strong>Small Businesses:</strong> Reach customers directly via WhatsApp</span>
                                        </li>
                                        <li className="flex items-start gap-2 text-sm sm:text-base text-gray-700">
                                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                            <span><strong>Resellers:</strong> Manage multiple client campaigns</span>
                                        </li>
                                        <li className="flex items-start gap-2 text-sm sm:text-base text-gray-700">
                                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                            <span><strong>Admins:</strong> Oversee all campaigns with advanced controls</span>
                                        </li>
                                    </ul>
                                </div>


                                {/* System Requirements */}
                                <div>
                                    <h3 className="text-lg sm:text-xl font-bold text-black mb-2 sm:mb-3 flex items-center gap-2">
                                        <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                                        <span>System Requirements</span>
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-gray-200">
                                            <p className="font-bold text-sm sm:text-base text-gray-800 mb-1">💻 Device</p>
                                            <p className="text-xs sm:text-sm text-gray-600">Desktop, Tablet, or Mobile</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-gray-200">
                                            <p className="font-bold text-sm sm:text-base text-gray-800 mb-1">🌐 Browser</p>
                                            <p className="text-xs sm:text-sm text-gray-600">Chrome, Firefox, Safari, Edge</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-gray-200">
                                            <p className="font-bold text-sm sm:text-base text-gray-800 mb-1">📶 Internet</p>
                                            <p className="text-xs sm:text-sm text-gray-600">Stable connection required</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-gray-200">
                                            <p className="font-bold text-sm sm:text-base text-gray-800 mb-1">👤 Account</p>
                                            <p className="text-xs sm:text-sm text-gray-600">User registration needed</p>
                                        </div>
                                    </div>
                                </div>


                                {/* Quick Setup */}
                                <div className="bg-green-50 rounded-xl p-4 sm:p-6 border-2 border-green-200">
                                    <h3 className="text-lg sm:text-xl font-bold text-green-800 mb-3 sm:mb-4 flex items-center gap-2">
                                        <Rocket className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                                        <span>Quick Setup Guide</span>
                                    </h3>
                                    <ol className="space-y-3">
                                        <li className="flex gap-2 sm:gap-3">
                                            <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">1</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm sm:text-base text-gray-800">Create Your Account</p>
                                                <p className="text-xs sm:text-sm text-gray-600">Register with your company name, email, and phone number</p>
                                            </div>
                                        </li>
                                        <li className="flex gap-2 sm:gap-3">
                                            <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">2</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm sm:text-base text-gray-800">Login to Dashboard</p>
                                                <p className="text-xs sm:text-sm text-gray-600">Access your personalized campaign management dashboard</p>
                                            </div>
                                        </li>
                                        <li className="flex gap-2 sm:gap-3">
                                            <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">3</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm sm:text-base text-gray-800">Create Your First Campaign</p>
                                                <p className="text-xs sm:text-sm text-gray-600">Navigate to "Send WhatsApp" and start creating!</p>
                                            </div>
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </section>


                    {/* Features Section */}
                    <section id="features" className="scroll-mt-8">
                        <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/80 shadow-xl p-4 sm:p-6 md:p-8">
                            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                                <div className="p-2 sm:p-3 bg-blue-500 rounded-xl flex-shrink-0">
                                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-black">Features</h2>
                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                {/* Campaign Management */}
                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 sm:p-6 border-2 border-green-300 shadow-md hover:scale-105 transition-transform">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                        <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
                                        <h3 className="text-base sm:text-xl font-bold text-green-800">Campaign Management</h3>
                                    </div>
                                    <p className="text-sm sm:text-base text-gray-700">
                                        Create, edit, and manage unlimited WhatsApp campaigns with customizable messages, media attachments, and interactive buttons.
                                    </p>
                                </div>


                                {/* Bulk Messaging */}
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 sm:p-6 border-2 border-blue-300 shadow-md hover:scale-105 transition-transform">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                        <Send className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
                                        <h3 className="text-base sm:text-xl font-bold text-blue-800">Bulk WhatsApp Messaging</h3>
                                    </div>
                                    <p className="text-sm sm:text-base text-gray-700">
                                        Send messages to thousands of contacts simultaneously. Import phone numbers easily via bulk upload or manual entry.
                                    </p>
                                </div>


                                {/* Excel Export */}
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 sm:p-6 border-2 border-purple-300 shadow-md hover:scale-105 transition-transform">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                        <Download className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
                                        <h3 className="text-base sm:text-xl font-bold text-purple-800">Excel Export</h3>
                                    </div>
                                    <p className="text-sm sm:text-base text-gray-700">
                                        Download campaign data as professionally formatted Excel files with all details, recipients, and timestamps.
                                    </p>
                                </div>


                                {/* Date Filtering */}
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 sm:p-6 border-2 border-orange-300 shadow-md hover:scale-105 transition-transform">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                        <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 flex-shrink-0" />
                                        <h3 className="text-base sm:text-xl font-bold text-orange-800">Advanced Filtering</h3>
                                    </div>
                                    <p className="text-sm sm:text-base text-gray-700">
                                        Filter campaigns by date range, search by name, and paginate through results with customizable entries per page.
                                    </p>
                                </div>


                                {/* Admin Dashboard */}
                                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 sm:p-6 border-2 border-red-300 shadow-md hover:scale-105 transition-transform">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                        <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 flex-shrink-0" />
                                        <h3 className="text-base sm:text-xl font-bold text-red-800">Admin Controls</h3>
                                    </div>
                                    <p className="text-sm sm:text-base text-gray-700">
                                        Role-based access control with Admin, Reseller, and User roles. Admins can view all campaigns and manage users.
                                    </p>
                                </div>


                                {/* Analytics */}
                                <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 sm:p-6 border-2 border-teal-300 shadow-md hover:scale-105 transition-transform">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                        <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600 flex-shrink-0" />
                                        <h3 className="text-base sm:text-xl font-bold text-teal-800">Campaign Analytics</h3>
                                    </div>
                                    <p className="text-sm sm:text-base text-gray-700">
                                        Track campaign performance with detailed statistics including recipient count, message length, and sending history.
                                    </p>
                                </div>


                                {/* Media Upload */}
                                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 sm:p-6 border-2 border-pink-300 shadow-md hover:scale-105 transition-transform">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                        <Image className="w-6 h-6 sm:w-8 sm:h-8 text-pink-600 flex-shrink-0" />
                                        <h3 className="text-base sm:text-xl font-bold text-pink-800">Media Support</h3>
                                    </div>
                                    <p className="text-sm sm:text-base text-gray-700">
                                        Upload images and videos with your campaigns. Cloud storage ensures fast delivery and reliable media hosting.
                                    </p>
                                </div>


                                {/* Complaint System */}
                                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 sm:p-6 border-2 border-yellow-300 shadow-md hover:scale-105 transition-transform">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                        <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 flex-shrink-0" />
                                        <h3 className="text-base sm:text-xl font-bold text-yellow-800">Support Tickets</h3>
                                    </div>
                                    <p className="text-sm sm:text-base text-gray-700">
                                        Built-in complaint management system. Users can submit issues and admins can respond with status tracking.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>


                    {/* How to Use Section */}
                    <section id="how-to-use" className="scroll-mt-8">
                        <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/80 shadow-xl p-4 sm:p-6 md:p-8">
                            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                                <div className="p-2 sm:p-3 bg-purple-500 rounded-xl flex-shrink-0">
                                    <Book className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-black">How to Use</h2>
                            </div>


                            <div className="space-y-6 sm:space-y-8">
                                {/* Create Campaign */}
                                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 sm:p-6 border-l-4 border-green-500">
                                    <h3 className="text-base sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-start gap-2">
                                        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>1. Create Your First Campaign</span>
                                    </h3>
                                    <ol className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700 ml-6 sm:ml-8 list-decimal">
                                        <li>Navigate to <strong>"Send WhatsApp"</strong> from the dashboard</li>
                                        <li>Enter a <strong>Campaign Name</strong> (e.g., "Summer Sale 2025")</li>
                                        <li>Write your <strong>Message</strong> in the text area</li>
                                        <li>Select <strong>Country Code</strong> for phone numbers</li>
                                        <li>Add <strong>Mobile Numbers</strong> (one per line or bulk import)</li>
                                        <li>Click <strong>"Create Campaign"</strong> to save</li>
                                    </ol>
                                </div>


                                {/* Upload Media */}
                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6 border-l-4 border-purple-500">
                                    <h3 className="text-base sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-start gap-2">
                                        <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                                        <span>2. Upload Campaign Media (Optional)</span>
                                    </h3>
                                    <ol className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700 ml-6 sm:ml-8 list-decimal">
                                        <li>In the campaign form, find the <strong>"Upload Media"</strong> section</li>
                                        <li>Click <strong>"Choose File"</strong> to select an image or video</li>
                                        <li>Supported formats: JPG, PNG, MP4</li>
                                        <li>Media will be automatically uploaded to cloud storage</li>
                                        <li>Preview will appear once upload is complete</li>
                                    </ol>
                                </div>


                                {/* View Reports */}
                                <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-4 sm:p-6 border-l-4 border-blue-500">
                                    <h3 className="text-base sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-start gap-2">
                                        <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <span>3. Track Campaign Reports</span>
                                    </h3>
                                    <ol className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700 ml-6 sm:ml-8 list-decimal">
                                        <li>Go to <strong>"WhatsApp Reports"</strong> page</li>
                                        <li>View all your campaigns in a sortable table</li>
                                        <li>See campaign name, message preview, recipients, and date</li>
                                        <li>Use <strong>pagination</strong> to browse through campaigns (10/25/50 per page)</li>
                                    </ol>
                                </div>


                                {/* Filter by Date */}
                                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 sm:p-6 border-l-4 border-orange-500">
                                    <h3 className="text-base sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-start gap-2">
                                        <Filter className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                                        <span>4. Filter Campaigns by Date</span>
                                    </h3>
                                    <ol className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700 ml-6 sm:ml-8 list-decimal">
                                        <li>On the Reports page, find the <strong>"Filter by Date"</strong> section</li>
                                        <li>Select a <strong>Start Date</strong> using the date picker</li>
                                        <li>Select an <strong>End Date</strong></li>
                                        <li>Results will automatically filter to show campaigns within that range</li>
                                        <li>Click <strong>"Reset Filter"</strong> to clear and view all campaigns</li>
                                    </ol>
                                </div>


                                {/* View Details */}
                                <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-xl p-4 sm:p-6 border-l-4 border-pink-500">
                                    <h3 className="text-base sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-start gap-2">
                                        <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 flex-shrink-0 mt-0.5" />
                                        <span>5. View Campaign Details</span>
                                    </h3>
                                    <ol className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700 ml-6 sm:ml-8 list-decimal">
                                        <li>Click the <strong>Eye icon</strong> (👁️) on any campaign row</li>
                                        <li>A modal will open showing:
                                            <ul className="ml-4 sm:ml-6 mt-2 list-disc space-y-1">
                                                <li><strong>User Information:</strong> Company name, email, phone, role, status</li>
                                                <li><strong>Campaign Details:</strong> ID, name, message, media, recipients</li>
                                                <li><strong>Statistics:</strong> Total recipients, character count, SMS parts</li>
                                            </ul>
                                        </li>
                                        <li>Click <strong>"Close"</strong> to return to the reports page</li>
                                    </ol>
                                </div>


                                {/* Download Excel */}
                                <div className="bg-gradient-to-r from-teal-50 to-green-50 rounded-xl p-4 sm:p-6 border-l-4 border-teal-500">
                                    <h3 className="text-base sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-start gap-2">
                                        <Download className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 flex-shrink-0 mt-0.5" />
                                        <span>6. Download Campaign Data</span>
                                    </h3>
                                    <ol className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700 ml-6 sm:ml-8 list-decimal">
                                        <li>On the Reports page or inside the details modal</li>
                                        <li>Click the <strong>Download icon</strong> (⬇️) button</li>
                                        <li>A loading spinner will appear during processing</li>
                                        <li>Excel file will automatically download to your device</li>
                                        <li>File name format: <code className="bg-gray-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm">CampaignName_YYYY-MM-DD.xlsx</code></li>
                                        <li>Excel contains all campaign details and recipient phone numbers</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* FAQ Section */}
                    <section id="faq" className="scroll-mt-8">
                        <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/80 shadow-xl p-4 sm:p-6 md:p-8">
                            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                                <div className="p-2 sm:p-3 bg-orange-500 rounded-xl flex-shrink-0">
                                    <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-black">Frequently Asked Questions</h2>
                            </div>


                            <div className="space-y-3 sm:space-y-4">
                                {/* FAQ Item 1 */}
                                <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 shadow-sm">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
                                        Q: How many phone numbers can I add to a campaign?
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-700">
                                        <strong>A:</strong> There's no limit! You can add as many phone numbers as needed. The system supports bulk import and handles large recipient lists efficiently.
                                    </p>
                                </div>


                                {/* FAQ Item 2 */}
                                <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 shadow-sm">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
                                        Q: What file formats are supported for media uploads?
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-700">
                                        <strong>A:</strong> You can upload images (JPG, PNG) and videos (MP4). All files are stored securely in the cloud for fast delivery.
                                    </p>
                                </div>


                                {/* FAQ Item 3 */}
                                <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 shadow-sm">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
                                        Q: Can I edit a campaign after creating it?
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-700">
                                        <strong>A:</strong> Currently, campaigns cannot be edited once created. However, you can create a new campaign with updated details and delete the old one if needed.
                                    </p>
                                </div>


                                {/* FAQ Item 4 */}
                                <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 shadow-sm">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
                                        Q: What's the difference between User, Reseller, and Admin roles?
                                    </h3>
                                    <div className="text-sm sm:text-base text-gray-700">
                                        <strong>A:</strong>
                                        <ul className="ml-4 sm:ml-6 mt-2 list-disc space-y-1">
                                            <li><strong>User:</strong> Can create and manage their own campaigns</li>
                                            <li><strong>Reseller:</strong> Can manage multiple client campaigns</li>
                                            <li><strong>Admin:</strong> Full access to all campaigns, users, and system settings</li>
                                        </ul>
                                    </div>
                                </div>


                                {/* FAQ Item 5 */}
                                <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 shadow-sm">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
                                        Q: How do I export my campaign data?
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-700">
                                        <strong>A:</strong> Click the Download button (⬇️) next to any campaign in the Reports page or in the campaign details modal. An Excel file will be generated and downloaded automatically.
                                    </p>
                                </div>


                                {/* FAQ Item 6 */}
                                <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 shadow-sm">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
                                        Q: Is my data secure?
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-700">
                                        <strong>A:</strong> Yes! All data is encrypted, passwords are hashed, and authentication uses secure JWT tokens. Your campaign data is stored safely in the cloud with regular backups.
                                    </p>
                                </div>


                                {/* FAQ Item 7 */}
                                <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 shadow-sm">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
                                        Q: Can I use this on my mobile device?
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-700">
                                        <strong>A:</strong> Absolutely! The platform is fully responsive and works seamlessly on smartphones, tablets, and desktops.
                                    </p>
                                </div>


                                {/* FAQ Item 8 */}
                                <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 shadow-sm">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
                                        Q: How do I report a problem or get support?
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-700 break-words">
                                        <strong>A:</strong> Use the built-in Complaint System to submit issues. Admins will respond to your queries with updates and solutions. You can also reach out via email at <a href="mailto:hello@prominds.digital" className="text-blue-600 font-bold underline break-all">hello@prominds.digital</a>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>


                    {/* About Section Creator and Developer */}
                    <section id="about" className="scroll-mt-8">
                        <div className="space-y-6 sm:space-y-8">
                            {/* Project Creator - ProMinds Digital */}
                            <div className="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-2xl border-2 border-blue-300 shadow-xl p-4 sm:p-6 md:p-8">
                                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                                    <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex-shrink-0">
                                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-black">Project Creator</h2>
                                </div>


                                <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                                    {/* Company Info */}
                                    <div className="text-center">
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto mb-3 sm:mb-4 shadow-xl overflow-hidden">
                                            <img 
                                                src="/promindsdigital.png"
                                                alt="ProMinds Digital Logo"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>


                                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">ProMinds Digital</h3>
                                        <p className="text-base sm:text-lg text-blue-600 font-semibold mb-1">(Formerly Prolific IDEAS)</p>
                                        <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Digital Marketing & IT Solutions Company</p>
                                        <p className="text-sm sm:text-base text-gray-700 leading-relaxed max-w-2xl mx-auto px-2">
                                            ProMinds Digital is a leading brand-driven performance marketing company that specializes in
                                            delivering comprehensive digital marketing and technology solutions. With expertise in Digital
                                            Marketing, WhatsApp Marketing, SEO, and cutting-edge web/app development, ProMinds empowers
                                            businesses to enhance their online presence and drive sustainable growth.
                                        </p>
                                    </div>


                                    {/* Services */}
                                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 sm:p-6 border-2 border-blue-200">
                                        <h4 className="text-base sm:text-lg font-bold text-gray-800 mb-3 text-center">🎯 Core Services</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                                            {['Digital Marketing', 'WhatsApp Marketing', 'SEO Services', 'Web Development', 'App Development', 'Performance Marketing'].map((service) => (
                                                <div key={service} className="px-2 sm:px-4 py-2 bg-white rounded-lg text-center text-xs sm:text-sm font-bold text-gray-700 shadow-sm border border-blue-100">
                                                    {service}
                                                </div>
                                            ))}
                                        </div>
                                    </div>


                                    {/* Company Links */}
                                    <div className="space-y-2 sm:space-y-3">
                                        <h4 className="text-base sm:text-lg font-bold text-gray-800 text-center mb-3 sm:mb-4">🌐 Connect with ProMinds Digital</h4>


                                        <a
                                            href="https://prominds.digital/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg"
                                        >
                                            <Globe className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm sm:text-base">ProMinds Digital Website</p>
                                                <p className="text-xs sm:text-sm text-blue-100 truncate">prominds.digital</p>
                                            </div>
                                        </a>


                                        <a
                                            href="https://prolificideas.in/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
                                        >
                                            <Globe className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm sm:text-base">Prolific IDEAS (Legacy Site)</p>
                                                <p className="text-xs sm:text-sm text-purple-100 truncate">prolificideas.in</p>
                                            </div>
                                        </a>


                                        <a
                                            href="https://www.facebook.com/promindsdigital/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
                                        >
                                            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                            </svg>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm sm:text-base">Facebook Page</p>
                                                <p className="text-xs sm:text-sm text-blue-100">Follow for updates</p>
                                            </div>
                                        </a>
                                    </div>


                                    {/* Company Stats */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 sm:pt-6">
                                        <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-300">
                                            <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-2" />
                                            <p className="text-base sm:text-xl font-bold text-blue-700">WhatsApp</p>
                                            <p className="text-xs text-gray-600">Marketing Expert</p>
                                        </div>
                                        <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-300">
                                            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mx-auto mb-2" />
                                            <p className="text-base sm:text-xl font-bold text-purple-700">SEO</p>
                                            <p className="text-xs text-gray-600">Optimization</p>
                                        </div>
                                        <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl border-2 border-pink-300 col-span-2 sm:col-span-1">
                                            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-pink-600 mx-auto mb-2" />
                                            <p className="text-base sm:text-xl font-bold text-pink-700">Digital</p>
                                            <p className="text-xs text-gray-600">Innovation</p>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Lead Developer - Anup Pradhan */}
                            <div className="bg-gradient-to-br from-green-100 via-teal-100 to-blue-100 rounded-2xl border-2 border-green-300 shadow-xl p-4 sm:p-6 md:p-8">
                                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                                    <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex-shrink-0">
                                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-black">Lead Developer</h2>
                                </div>


                                <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                                    {/* Developer Info */}
                                    <div className="text-center">
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto mb-3 sm:mb-4 shadow-xl overflow-hidden">
                                            <img 
                                                src="/anup-pradhan.jpeg"
                                                alt="Anup Pradhan"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Anup Pradhan</h3>
                                        <p className="text-base sm:text-lg text-green-600 font-semibold mb-1">Full-Stack MERN Developer</p>
                                        <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-green-100 border-2 border-green-500 rounded-full mb-3 sm:mb-4">
                                            <p className="text-xs sm:text-sm font-bold text-green-700">💻 Solo Developer - Built Entire Product</p>
                                        </div>
                                        <p className="text-sm sm:text-base text-gray-700 leading-relaxed max-w-2xl mx-auto px-2">
                                            Sole architect and developer of the WhatsApp Campaign Management System. Specialized in building
                                            scalable full-stack applications with the MERN stack (MongoDB, Express, React, Node.js) and TypeScript.
                                            Passionate about creating intuitive user experiences backed by robust, secure backend systems.
                                            Single-handedly developed this comprehensive platform from concept to production.
                                        </p>
                                    </div>


                                    {/* Tech Stack */}
                                    <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4 sm:p-6 border-2 border-green-200">
                                        <h4 className="text-base sm:text-lg font-bold text-gray-800 mb-3 text-center">🛠️ Technologies Used</h4>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {[
                                                'React',
                                                'TypeScript',
                                                'Node.js',
                                                'Express',
                                                'MongoDB',
                                                'Mongoose',
                                                'Tailwind CSS',
                                                'JWT Auth',
                                                'Cloudinary',
                                                'ExcelJS',
                                                'Multer',
                                                'Vite'
                                            ].map((tech) => (
                                                <span key={tech} className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-white rounded-full text-xs sm:text-sm font-bold text-gray-700 shadow-sm border border-green-200">
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    </div>


                                    {/* Developer Links */}
                                    <div className="space-y-2 sm:space-y-3">
                                        <h4 className="text-base sm:text-lg font-bold text-gray-800 text-center mb-3 sm:mb-4">📫 Connect with Developer</h4>


                                        <a
                                            href="https://github.com/M0rs-Ruki/WhatsApp-Campaigner"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-all transform hover:scale-105 shadow-lg"
                                        >
                                            <Github className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm sm:text-base">GitHub Repository</p>
                                                <p className="text-xs sm:text-sm text-gray-300 truncate">View complete source code</p>
                                            </div>
                                        </a>


                                        <a
                                            href="https://www.linkedin.com/in/anup-pradhan77"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
                                        >
                                            <Linkedin className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm sm:text-base">LinkedIn Profile</p>
                                                <p className="text-xs sm:text-sm text-blue-100 truncate">Let's connect professionally</p>
                                            </div>
                                        </a>


                                        <a
                                            href="https://morscode.site/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
                                        >
                                            <Globe className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm sm:text-base">Portfolio Website</p>
                                                <p className="text-xs sm:text-sm text-purple-100 truncate">Check out other projects</p>
                                            </div>
                                        </a>


                                        <a
                                            href="mailto:anuppradhan929@gmail.com"
                                            className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all transform hover:scale-105 shadow-lg"
                                        >
                                            <Mail className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm sm:text-base">Email Developer</p>
                                                <p className="text-xs sm:text-sm text-green-100 break-all">anuppradhan929@gmail.com</p>
                                            </div>
                                        </a>
                                    </div>


                                    {/* Development Highlights */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-4 sm:pt-6">
                                        <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-300">
                                            <Database className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-2" />
                                            <p className="text-base sm:text-xl font-bold text-green-700">MongoDB</p>
                                            <p className="text-xs text-gray-600">Database</p>
                                        </div>
                                        <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-300">
                                            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-2" />
                                            <p className="text-base sm:text-xl font-bold text-blue-700">JWT</p>
                                            <p className="text-xs text-gray-600">Security</p>
                                        </div>
                                        <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-300">
                                            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mx-auto mb-2" />
                                            <p className="text-base sm:text-xl font-bold text-purple-700">React</p>
                                            <p className="text-xs text-gray-600">Frontend</p>
                                        </div>
                                        <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-300">
                                            <Rocket className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 mx-auto mb-2" />
                                            <p className="text-base sm:text-xl font-bold text-orange-700">Node.js</p>
                                            <p className="text-xs text-gray-600">Backend</p>
                                        </div>
                                    </div>
                                </div>


                                {/* Collaboration Note */}
                                <div className="mt-4 sm:mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 sm:p-6 border-2 border-yellow-300">
                                    <p className="text-center text-sm sm:text-base text-gray-700 leading-relaxed px-2">
                                        <strong className="text-orange-600">🤝 Project Collaboration:</strong> This WhatsApp Campaign Management System
                                        was conceptualized by <strong>ProMinds Digital</strong> and developed from scratch by{' '}
                                        <strong>Anup Pradhan</strong> as the sole full-stack developer, handling everything from database
                                        design to frontend implementation.
                                    </p>
                                </div>
                            </div>


                            {/* Support Section */}
                            <div className="text-center bg-white/60 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/80 shadow-lg">
                                <p className="text-xs sm:text-sm text-gray-600 px-2">
                                    ⭐ If you find this project helpful, star it on{' '}
                                    <a
                                        href="https://github.com/M0rs-Ruki/WhatsApp-Campaigner"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 font-bold hover:underline"
                                    >
                                        GitHub
                                    </a>
                                    !
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Built with passion using MERN Stack + TypeScript
                                </p>
                            </div>
                        </div>
                    </section>


                </main>
            </div>
        </div>
    );
};


export default Documentation;

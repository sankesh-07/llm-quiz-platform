import { useNavigate } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500 selection:text-white overflow-x-hidden relative">
            {/* Starry Background Effect */}
            <div className="fixed inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none"></div>
            {/* Neon side lines inspired by image */}
            <div className="fixed top-1/2 left-0 w-32 h-[500px] -translate-y-1/2 bg-gradient-to-r from-purple-600/20 to-transparent blur-[50px] pointer-events-none"></div>

            <div className="relative z-10">
                {/* Navbar */}
                <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
                    <div className="text-2xl font-bold tracking-wide text-white">
                        QuizGenius
                    </div>

                    <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-300">
                        <a href="#" className="text-white border-b-2 border-white pb-1">Home</a>
                    </div>

                    <div className="flex items-center space-x-6 text-sm font-medium">
                        <button onClick={() => navigate('/login')} className="text-gray-300 hover:text-white transition">
                            Login
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="bg-white text-black px-6 py-2 rounded shadow hover:bg-gray-100 transition font-bold"
                        >
                            Sign Up
                        </button>
                    </div>
                </nav>

                <main className="max-w-7xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    {/* Left Content */}
                    <div className="space-y-8">
                        <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight uppercase max-w-lg">
                            Welcome to <br /> QuizGenius: <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                                AI-Powered Knowledge Adventures!
                            </span>
                        </h1>

                        <div className="space-y-6">
                            <button
                                onClick={() => navigate('/login')}
                                className="px-8 py-3 rounded-full border border-gray-400 text-white uppercase tracking-wider hover:bg-white hover:text-black transition"
                            >
                                Start A Quiz
                            </button>

                            <button className="flex items-center gap-3 text-gray-300 hover:text-white transition group">
                                <div className="w-6 h-6 rounded bg-gray-800 flex items-center justify-center group-hover:bg-gray-700">
                                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                </div>
                                <span className="text-sm">Browse All Topics</span>
                            </button>
                        </div>

                        <div className="pt-12 flex flex-wrap gap-3">
                            <span className="px-5 py-2 rounded-full border border-gray-800 bg-gray-900/50 text-xs text-gray-300">MCQ&A</span>
                            <span className="px-5 py-2 rounded-full border border-gray-800 bg-gray-900/50 text-xs text-gray-300">WEB DEVELOPMENT</span>
                            <span className="px-5 py-2 rounded-full border border-gray-800 bg-gray-900/50 text-xs text-gray-300">DESK</span>
                        </div>
                    </div>

                    {/* Right Content */}
                    <div className="relative flex justify-center lg:justify-end">
                        {/* Main Neon Brain Image */}
                        <div className="relative w-full max-w-lg aspect-square">
                            <img
                                src="/assets/hero-home-quiz.png"
                                alt="Neon Brain AI"
                                className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                                style={{ filter: 'brightness(1.1) contrast(1.1)' }}
                            />
                        </div>

                        {/* Floating Cards Container */}

                    </div>
                </main>
            </div>
        </div>
    );
}

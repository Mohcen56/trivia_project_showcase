import Image from "next/image";
import Link from "next/link";
import HeaderAvatar from "@/components/HeaderAvatar";
import HeroCTA from "@/components/HeroCTA";
import { Timer,GalleryHorizontalEnd  } from "lucide-react";

export default function HomePage() {

 
  
  return (
    <>
      <div className="bg-gradient-to-b from-cyan-900 to-cyan-800">
        {/* Header */}
      <header className="relative z-10 backdrop-blur-md">
  <div className="container mx-auto flex items-center px-3 py-3 relative">
    <HeaderAvatar />
  </div>
</header>

      
      
        <div className="relative px-6 pt-0   lg:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-288.75"
          />
        </div>
        <div className="mx-auto max-w-2xl relative z-10  -mt-10 md:-mt-30 pt-4 pb-32 sm:pt-10 sm:pb-40 lg:pt-0 lg:pb-12">
  <div className="text-center">
    {/* Logo */}
    <div className="flex justify-center mb-12 relative z-50">
      <Image
        src="logo/logo3.svg"
        alt="Trivia Logo"
        width={650}
        height={650}
        className="mx-auto relative z-50"
        priority
      />
    </div>

    {/* Paragraphs */}
    <p className="lg:text-3xl  -mt-20 font-bold lg:-mt-40 text-cyan-100 mb-4">
      The Best Trivia game for families and friends
    </p>
    <p className="text-sm lg:text-lg text-gray-300 max-w-lg mx-auto leading-relaxed mb-6 lg:mb-10">
      Enjoy your time with Trivia — the knowledge and challenge game that brings everyone together.
    </p>
    <div className="mt-8 flex justify-center">
      <HeroCTA />
    </div>
  </div>
</div>

        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-288.75"
          />
        </div>
      </div>
      </div>
<section className="py-20 bg-white text-center">
  <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Trivia Spirit?</h2>
  <p className="text-gray-500 p-2 mb-12">
    Trivia Spirit combines fun and learning in a unique experience suitable for everyone in the family.
  </p>

  <div className="grid gap-6 md:grid-cols-3 p-4 max-w-6xl mx-auto">
    <div className="rounded-2xl bg-blue-50 p-8">
      <div className="flex justify-center mb-4">
        <div className="bg-blue-500 text-white p-3 rounded-full">
          <Image src="/icons/people.svg" alt="People icon" width={24} height={24} className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-800">For Family & Friends</h3>
      <p className="text-gray-600">
        A fun group game that brings loved ones together and creates beautiful memories filled with laughter and joy.
      </p>
    </div>

    <div className="rounded-2xl bg-green-50 p-8">
      <div className="flex justify-center mb-4">
        <div className="bg-green-500 text-white p-3 rounded-full">
          <Image src="/icons/brain.svg" alt="Brain icon" width={24} height={24} className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-800">Boosts Knowledge</h3>
      <p className="text-gray-600">
        A variety of questions about culture, history, and science help you expand your knowledge in a fun way.
      </p>
    </div>

    <div className="rounded-2xl bg-purple-50 p-8">
      <div className="flex justify-center mb-4">
        <div className="bg-purple-500 text-white p-3 rounded-full">
          <Image src="/icons/cup-reward.svg" alt="Reward cup icon" width={24} height={24} className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-800">Competitive Spirit</h3>
      <p className="text-gray-600">
        A points and challenges system that inspires a healthy competitive atmosphere between teams.
      </p>
    </div>
  </div>
</section>
<section id="how-to-play" className="py-20 text-center bg-[#f4f6fd]">
  <h2 className="text-4xl font-bold  mb-20">How to Play?</h2>

  <div className="flex flex-wrap justify-center gap-6 max-w-7xl mx-auto mb-6 mt-10">
    {/* Teams */}
    <div className="rounded-2xl bg-blue-50 shadow-lg max-w-[16rem] p-8">
      <div className="flex justify-center mb-4">
        <div className="bg-blue-500 text-white p-3   rounded-full">
          <Image src="/icons/people.svg" alt="People icon" width={24} height={24} className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-800">Teams</h3>
      <p className="text-gray-600">
        Two teams compete against each other.
      </p>
    </div>

    {/* Choose Categories */}
    <div className="rounded-2xl bg-purple-50  shadow-lg max-w-[16rem] p-8">
      <div className="flex justify-center mb-4">
        <div className="bg-purple-500 text-white p-3 rounded-full">
          <GalleryHorizontalEnd  width={24} height={24} className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-800">Choose Categories</h3>
      <p className="text-gray-600">
        Each team selects 3 categories.
      </p>
    </div>

    {/* Team Turn */}
    <div className="rounded-2xl bg-green-50 shadow-lg max-w-[16rem] p-8">
      <div className="flex justify-center mb-4">
        <div className="bg-green-500 text-white p-3 rounded-full">
          <Image src="/icons/arrow-change.svg" alt="Turn icon" width={24} height={24} className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-800">Team Turn</h3>
      <p className="text-gray-600">
        Teams take turns choosing questions.
      </p>
    </div>

    {/* Time */}
    <div className="rounded-2xl bg-orange-50 shadow-lg max-w-[16rem] p-8">
      <div className="flex justify-center mb-4">
        <div className="bg-orange-500 text-white p-3 rounded-full">
          <Timer width={24} height={24} className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-800">Time</h3>
      <p className="text-gray-600">
        60 seconds for Team 1, 30 seconds for Team 2.
      </p>
    

  </div>
  
  {/* Winning Card - Centered Below */}
 
    <div className="rounded-2xl bg-yellow-50 p-8  shadow-lg max-w-[16rem]">
      <div className="flex justify-center mb-4">
        <div className="bg-yellow-500 text-white p-3 rounded-full">
          <Image src="/icons/cup-reward.svg" alt="Reward cup icon" width={24} height={24} className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-800">Winning</h3>
      <p className="text-gray-600">
        The team with the highest score wins!
      </p>
    </div>
  </div>
</section>
<section id="help-perks" className="  py-30">
  <div className="container mx-auto px-6 text-center">
    {/* Title */}
    <h2 className="text-4xl font-bold text-gray-800 -mt-10 mb-20">
      Help Perks
    </h2>

    {/* Grid layout */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">

      {/* Double Points */}
      <div className="relative bg-[#cde1f2] rounded-3xl shadow-md px-8 py-15 flex flex-row items-center justify-between overflow-hidden">
        <div className="text-left max-w-[70%]">
          <h3 className="text-2xl font-bold text-gray-800 -mt-10  mb-2">Double Points</h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            Boost your score! Activate this perk to double your points for one question.
            
          </p>
        </div>
        <div className="text-6xl flex-shrink-0"><Image src="/icons/Untitled design.svg" alt="multiplier icon" width={25} height={25} className="w-20 h-20" /></div>
        <div className="absolute bottom-0 left-0 right-0 bg-[#1f1f2b] text-white text-sm font-medium py-2 rounded-b-3xl">
          Use before answering
        </div>
      </div>

      {/* Change Question */}
      <div className="relative bg-[#cde1f2] rounded-3xl shadow-md px-8 py-15 flex flex-row items-center justify-between overflow-hidden">
        <div className="text-left max-w-[70%]">
          <h3 className="text-2xl font-bold text-gray-800 -mt-11 mb-2">Change Question</h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            Don’t like the current question? Swap it for a new one and get another chance
            to earn points.
          </p>
        </div>
        <div className="text-6xl flex-shrink-0"><Image src="/icons/arrow-change.svg" alt="refresh icon" width={25} height={25} className="w-20 h-20" /></div>
        <div className="absolute bottom-0 left-0 right-0 bg-[#1f1f2b] text-white text-sm font-medium py-2 rounded-b-3xl">
          Use after seeing the question
        </div>
      </div>

      {/* Show Choices */}
      <div className="relative bg-[#cde1f2] rounded-3xl shadow-md px-8 py-10 flex flex-row items-center justify-between overflow-hidden">
        <div className="text-left max-w-[70%]">
          <h3 className="text-2xl font-bold text-gray-800 -mt-5 mb-2">Show Choices</h3>
          <p className="text-gray-700 text-sm leading-relaxed mb-2">
            Reveal the available answer options to make your decision easier and
            improve your odds of winning.
          </p>
        </div>
        <div className="text-6xl flex-shrink-0"><Image src="/icons/clover-48-regular.svg" alt="multiplier icon" width={25} height={25} className="w-20 h-20" /></div>
        <div className="absolute bottom-0 left-0 right-0 bg-[#1f1f2b] text-white text-sm font-medium py-2 rounded-b-3xl">
          Use after seeing the question
        </div>
      </div>

    </div>
  </div>
</section>



<footer className="bg-gradient-to-b from-cyan-900 to-cyan-800 text-gray-200 pt-10 p-1">
  <div className="container mx-auto px-6 grid grid-cols-1 mb-3 md:grid-cols-3 gap-10  justify-center items-center lg:items-start">

    {/* Logo + Description (LEFT in English) */}
    <div className="  text-center lg:text-left space-y-3">
      {/* SVG Logo Placeholder */}
    <div className="-mt-8 lg:-ml-40 ">
      <Image
        src="logo/mylogo.svg"
        alt="Trivia Logo"
        width={150}
        height={150}
        className="mx-auto"
      />
   
      </div>
      <h3 className="text-lg font-bold text-white -mt-2">Trivia Spirit – Family & Friends Game</h3>
      <p className="text-gray-300 text-sm leading-relaxed">
        The ultimate trivia game that brings family and friends together for laughter,
        fun, and learning through a variety of unique question categories.
      </p>
    </div>

    {/* Download App (CENTER) */}
    <div className="flex flex-col  justify-content-center items-center md:items-start">
      <h3 className="text-lg font-bold mb-5">Get the App</h3>

      {/* Google Play */}
      <div className="relative group mb-4 w-full items-center  max-w-2xs">
        <div className="flex items-center justify-between bg-[#3c4b6d] text-white px-4 py-3 rounded-xl shadow-md cursor-not-allowed">
        <div className="flex items-center justify-content-center gap-3">
             <span className="font-medium text-sm">Available soon <span className="font-semibold text-sm"> on Google Play</span> </span>
            <Image src="/logo/playstore.svg" alt="Google Play" width={24} height={24} className="w-6 h-6" />
          </div>
        </div>
        <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center 
                        text-white text-sm font-semibold opacity-0 group-hover:opacity-100 
                        transition-opacity duration-300">
          Coming Soon
        </div>
      </div>

      {/* App Store */}
        <div className="relative group mb-4  w-full max-w-2xs">
        <div className="flex items-center justify-between bg-[#3c4b6d] text-white px-4 py-3 rounded-xl shadow-md cursor-not-allowed">
        <div className="flex items-center gap-6">
           <span className="font-medium text-sm">Available soon <span className="font-semibold text-sm"> on App Store</span> </span>
          <Image src="/logo/app-store.svg" alt="App Store" width={24} height={24} className="w-6 h-6" />
        </div>
        </div>
        <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center 
                        text-white text-sm font-semibold opacity-0 group-hover:opacity-100 
                        transition-opacity duration-300">
          Coming Soon
        </div>
      </div>
    </div>

    {/* Useful Links (RIGHT in English) */}
    <div className=" text-center lg:text-left ">
      <h3 className="text-xl font-bold mb-5">Useful Links</h3>
      <ul className="space-y-3 text-gray-300 text-lg">
        <li>
          <Link href="#how-to-play" className="flex items-center gap-2 justify-center  lg:justify-start  hover:text-white transition">
            <Image src="/icons/brain.svg" alt="Brain icon" width={24} height={24} className="w-6 h-6" /> How to Play
          </Link>
        </li>
        <li>
          <Link href="#help-perks" className="flex items-center gap-2 justify-center lg:justify-start  hover:text-white transition">
            <Image src="/icons/bars-4.svg" alt="Help perks icon" width={24} height={24} className="w-6 h-6" /> help perks
          </Link>
        </li>
        <li>
          <a
            href="https://instagram.com/trivia.spirit"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 justify-center lg:justify-start hover:text-white transition"
          >
            <Image
              src="/logo/Instagram_Glyph_Gradient.svg"
              alt="Instagram"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            <span>Follow us on Instagram</span>
          </a>
        </li>
        <li>
          <a
            href="https://discord.gg/cYC6rMVKHj"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 justify-center lg:justify-start hover:text-white transition"
          >
            <Image
              src="/logo/discord.webp"
              alt="Discord"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            <span>Join us on Discord</span>
          </a>
        </li>
      </ul>
    </div>
  </div>

  {/* Divider + Copyright */}
    
<div className= " border-t border-gray-500/40 py-2 mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-3 text-sm text-gray-400">
  <span>© {new Date().getFullYear()} Trivia Spirit. All rights reserved.</span>
  <span className="font-bold text-gray-300">•</span>

  <Link href="/terms" className="hover:text-gray-200">
    Terms of Service
  </Link>

  <span className="font-bold text-gray-300">•</span>

  <Link href="/privacy" className="hover:text-gray-200">
    Privacy Policy
  </Link>

  <span className="font-bold text-gray-300">•</span>

  <Link href="/refund" className="hover:text-gray-200">
    Refund Policy
  </Link>

  

  
</div>

  

</footer>


     
     
    
    </>
  );
}

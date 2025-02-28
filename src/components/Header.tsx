import Image from 'next/image';

const Header = () => {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold">Louis Vuitton</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">Summer 24' Campaign</span>
              <span className="text-gray-400">•</span>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                <span className="text-gray-600">Production</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 rounded-lg border border-gray-200 px-4 py-1.5 text-sm hover:bg-gray-50">
              <span>Add teammates</span>
              <span className="text-gray-400">→</span>
            </button>
            <button className="text-gray-600 hover:text-gray-800">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </button>
            <div className="h-8 w-8 rounded-full bg-gray-200"></div>
          </div>
        </div>
        
        <nav className="mt-4">
          <ul className="flex space-x-6">
            {['Overview', 'Users', 'Organizations', 'Billing', 'Configure', 'Settings'].map((item) => (
              <li key={item}>
                <a
                  href="#"
                  className={`text-sm ${
                    item === 'Configure' ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 
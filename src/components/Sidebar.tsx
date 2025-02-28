const Sidebar = () => {
  const menuItems = [
    { title: 'General', items: [
      { name: 'Authentication', icon: '🔒' },
      { name: 'SMS template', icon: '📱' },
      { name: 'Email templates', icon: '📧' },
    ]},
    { title: 'Organization', items: [
      { name: 'Settings', icon: '⚙️' },
      { name: 'Roles and permissions', icon: '👥' },
    ]},
    { title: 'Security', items: [
      { name: 'Restrictions', icon: '🛡️' },
      { name: 'Fraud detection', icon: '🔍' },
    ]},
    { title: 'Developers', items: [
      { name: 'Sessions', icon: '💻' },
      { name: 'JWT templates', icon: '🔑' },
      { name: 'Webhooks', icon: '🔗' },
      { name: 'Paths / Routing', icon: '🛣️' },
      { name: 'Domains', icon: '🌐' },
      { name: 'Integrations', icon: '🔌' },
      { name: 'API keys', icon: '🔐' },
    ]},
  ];

  return (
    <aside className="w-64 border-r border-gray-200 bg-white p-6">
      {menuItems.map((section) => (
        <div key={section.title} className="mb-6">
          <h3 className="mb-2 text-xs font-medium text-gray-500">{section.title}</h3>
          <ul className="space-y-1">
            {section.items.map((item) => (
              <li key={item.name}>
                <a
                  href="#"
                  className={`flex items-center space-x-2 rounded-lg px-3 py-2 text-sm ${
                    item.name === 'API keys'
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
};

export default Sidebar; 
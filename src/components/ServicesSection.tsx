{/* Inside ServicesSection.tsx – replace the card JSX in your services.map(...) with this version */}

{services.map((service, index) => {
  const Icon = service.icon;

  return (
    <motion.div
      key={service.title}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="group relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-[#8b5cf6]/50 hover:shadow-xl transition-all duration-300"
    >
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
      />

      <div className="relative">
        <div
          className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${service.gradient} mb-6`}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>

        <h3 className="text-2xl font-bold mb-3 text-gray-900">
          {service.title}
        </h3>

        <p className="text-gray-600 mb-6 leading-relaxed">
          {service.description}
        </p>

        <ul className="space-y-3 mb-0">
          {service.features.map((feature, featureIndex) => (
            <li
              key={featureIndex}
              className="flex items-start gap-3 text-gray-700"
            >
              <div
                className={`mt-1 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${service.gradient} flex-shrink-0`}
              />
              <span className="text-sm leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div
        className={`absolute -bottom-px -right-px w-32 h-32 bg-gradient-to-br ${service.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
      />
    </motion.div>
  );
})}
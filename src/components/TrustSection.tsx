<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
  {points.map((item, index) => (
    <div
      key={index}
      className="p-8 rounded-3xl bg-white border border-gray-200 shadow-sm"
    >
      {item.icon}
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">
        {item.title}
      </h3>
      <p className="text-gray-600 text-lg leading-relaxed">
        {item.text}
      </p>
    </div>
  ))}
</div>

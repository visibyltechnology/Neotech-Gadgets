import { getOrderStatusConfig } from '../utils/orderStatusHelper';

function OrderTrackingStepper({ status, showDescription = true }) {
  const config = getOrderStatusConfig(status);
  const allSteps = [
    { step: 1, label: 'Order Placed' },
    { step: 2, label: 'Payment Confirmed' },
    { step: 3, label: 'Package Shipped' },
    { step: 4, label: 'Out for Delivery' },
    { step: 5, label: 'Delivered' }
  ];

  const currentStep = config.step;

  return (
    <div className="w-full">
      {/* Main Stepper */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {allSteps.map((step, idx) => {
            const isActive = step.step <= currentStep;
            const isCurrentStep = step.step === currentStep;
            const showConnector = idx < allSteps.length - 1;

            return (
              <div key={step.step} className="flex-1 flex items-center">
                {/* Step Circle */}
                <div className="flex flex-col items-center flex-1">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all relative z-10 border-2"
                    style={{
                      background: isActive ? config.bgColor : '#f3f4f6',
                      color: isActive ? config.textColor : '#d1d5db',
                      borderColor: isActive ? config.textColor : '#e5e7eb',
                      boxShadow: isCurrentStep ? `0 0 0 4px ${config.bgColor}` : 'none'
                    }}
                  >
                    {step.step}
                  </div>
                  <p className="text-xs font-bold mt-2 text-center text-gray-600">
                    {step.label}
                  </p>
                </div>

                {/* Connector Line */}
                {showConnector && (
                  <div
                    className="h-1 flex-1 mx-1"
                    style={{
                      background: isActive && allSteps[idx + 1].step <= currentStep
                        ? config.textColor
                        : '#e5e7eb',
                      transition: 'all 0.3s ease'
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Card */}
      <div
        className="rounded-lg p-6 border-l-4 transition-all"
        style={{
          background: config.bgColor,
          borderLeftColor: config.textColor
        }}
      >
        <div className="flex items-start gap-4">
          <span className="text-3xl">{config.icon}</span>
          <div>
            <h3 style={{ color: config.textColor }} className="font-bold text-lg mb-1">
              {config.label}
            </h3>
            {showDescription && (
              <p style={{ color: config.textColor }} className="opacity-75 text-sm">
                {config.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Events (Optional - for future use) */}
      {/* You can add a timeline of all status updates here */}
    </div>
  );
}

export default OrderTrackingStepper;

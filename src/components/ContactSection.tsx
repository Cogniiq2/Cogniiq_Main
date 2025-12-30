import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Checkbox } from './ui/checkbox';
import { CheckCircle2, Video, Target, Clock, Sparkles, ArrowRight, Calendar, MessageSquare, Rocket } from 'lucide-react';

export function ContactSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    industry: '',
    timeline: '',
    goal: '',
    preferredTime: '',
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      email: formData.email,
      company: formData.company,
      industry: formData.industry,
      interests,
      timeline: formData.timeline,
      goal: formData.goal,
      preferredTime: formData.preferredTime,
    };

    await fetch("https://hook.eu2.make.com/g7kngisz3tnvrju4q3qnidoi8sqxb65m", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    setIsSubmitted(true);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceedStep1 = formData.name && formData.email && formData.company;
  const canProceedStep2 = formData.industry && interests.length > 0;
  const canSubmit = canProceedStep1 && canProceedStep2 && formData.timeline && formData.goal;

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const benefits = [
    { icon: Video, text: '30–45 Minuten Videocall' },
    { icon: Target, text: 'Analyse deines Status Quo' },
    { icon: Clock, text: 'Konkrete Next Steps & grobe Budget-Spanne' },
  ];

  if (isSubmitted) {
    return (
      <section id="kontakt" ref={ref} className="relative py-32 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                y: [null, Math.random() * window.innerHeight],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <div className="max-w-4xl mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="text-center relative"
          >
            {/* Success glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" />

            <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-12 shadow-2xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ duration: 0.6, delay: 0.3, type: "spring" }}
                className="inline-flex p-6 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 mb-8 relative"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 blur-xl opacity-50"
                />
                <CheckCircle2 className="w-16 h-16 text-white relative z-10" />
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-4xl lg:text-5xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
              >
                Perfekt! Ihre Anfrage ist bei uns eingegangen
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-xl text-gray-300 mb-8 leading-relaxed"
              >
                Unser Team prüft Ihre Anfrage und meldet sich innerhalb von 24-48 Stunden mit konkreten Terminvorschlägen für Ihr Erstgespräch.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Button
                  onClick={() => {
                    setIsSubmitted(false);
                    setCurrentStep(1);
                    setFormData({
                      name: '',
                      email: '',
                      company: '',
                      industry: '',
                      timeline: '',
                      goal: '',
                      preferredTime: '',
                    });
                    setInterests([]);
                  }}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-sm px-8 py-6 text-lg rounded-xl transition-all duration-300 hover:scale-105"
                >
                  Weitere Anfrage senden
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="kontakt"
      ref={ref}
      className="relative py-32 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 overflow-hidden"
      aria-labelledby="contact-heading"
    >
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-white/10 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300 font-medium">Premium Beratung</span>
          </motion.div>

          <h2
            id="contact-heading"
            className="text-4xl lg:text-6xl font-bold mb-6 text-white leading-tight"
          >
            Bereit für{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              außergewöhnliche Ergebnisse
            </span>
            ?
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Buchen Sie jetzt Ihr kostenloses Erstgespräch und erfahren Sie, wie wir Ihre Vision zum Leben erwecken
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* LEFT SIDE */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Step Indicator */}
            <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: currentStep === step ? 1.1 : 1,
                        backgroundColor: currentStep >= step ? 'rgb(59, 130, 246)' : 'rgba(255, 255, 255, 0.1)',
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        currentStep >= step ? 'text-white' : 'text-gray-500'
                      } relative`}
                    >
                      {currentStep > step ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        step
                      )}
                      {currentStep === step && (
                        <motion.div
                          className="absolute inset-0 rounded-full bg-blue-500/50"
                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                    {step < 3 && (
                      <motion.div
                        initial={false}
                        animate={{
                          backgroundColor: currentStep > step ? 'rgb(59, 130, 246)' : 'rgba(255, 255, 255, 0.1)',
                        }}
                        className="w-16 h-1 mx-2"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Schritt {currentStep} von 3
                </p>
                <p className="text-lg text-white font-semibold mt-1">
                  {currentStep === 1 && 'Ihre Kontaktdaten'}
                  {currentStep === 2 && 'Ihr Interesse'}
                  {currentStep === 3 && 'Projektdetails'}
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white mb-6">
                Was Sie erwartet:
              </h3>
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{
                      duration: 0.6,
                      delay: 0.2 + index * 0.1,
                    }}
                    whileHover={{ x: 10, scale: 1.02 }}
                    className="group relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                        className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all duration-300"
                      >
                        <Icon className="w-6 h-6 text-blue-400" />
                      </motion.div>
                      <span className="text-gray-300 font-medium group-hover:text-white transition-colors">
                        {benefit.text}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/5 to-pink-500/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.div>
                );
              })}
            </div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.8 }}
              className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Rocket className="w-6 h-6 text-blue-400" />
                <h4 className="text-white font-bold">Schnelle Reaktionszeit</h4>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Wir melden uns garantiert innerhalb von 24-48 Stunden mit einem konkreten Vorschlag und Terminoptionen für Ihr Erstgespräch.
              </p>
            </motion.div>
          </motion.div>

          {/* RIGHT SIDE */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20" />

            <form
              onSubmit={handleSubmit}
              className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl space-y-6"
            >
              <AnimatePresence mode="wait">
                {/* STEP 1: Contact Information */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <motion.div
                      className="space-y-3"
                      animate={focusedField === 'name' ? { scale: 1.02 } : { scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Label htmlFor="name" className="text-white font-medium flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full" />
                        Vollständiger Name
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateFormData('name', e.target.value)}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        required
                        placeholder="Max Mustermann"
                        className="bg-white/5 border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 text-white placeholder:text-gray-500 transition-all duration-300 hover:bg-white/10 h-12"
                      />
                    </motion.div>

                    <motion.div
                      className="space-y-3"
                      animate={focusedField === 'email' ? { scale: 1.02 } : { scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Label htmlFor="email" className="text-white font-medium flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full" />
                        E-Mail
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        required
                        placeholder="max@beispiel.de"
                        className="bg-white/5 border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 text-white placeholder:text-gray-500 transition-all duration-300 hover:bg-white/10 h-12"
                      />
                    </motion.div>

                    <motion.div
                      className="space-y-3"
                      animate={focusedField === 'company' ? { scale: 1.02 } : { scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Label htmlFor="company" className="text-white font-medium flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full" />
                        Unternehmen / Projektname
                      </Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => updateFormData('company', e.target.value)}
                        onFocus={() => setFocusedField('company')}
                        onBlur={() => setFocusedField(null)}
                        required
                        placeholder="Ihre Firma GmbH"
                        className="bg-white/5 border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 text-white placeholder:text-gray-500 transition-all duration-300 hover:bg-white/10 h-12"
                      />
                    </motion.div>

                    <Button
                      type="button"
                      onClick={() => canProceedStep1 && setCurrentStep(2)}
                      disabled={!canProceedStep1}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-6 text-lg rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
                    >
                      Weiter
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                )}

                {/* STEP 2: Industry & Interests */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-3">
                      <Label className="text-white font-medium flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-400 rounded-full" />
                        Branche
                      </Label>
                      <Select
                        value={formData.industry}
                        onValueChange={(value) => updateFormData('industry', value)}
                        required
                      >
                        <SelectTrigger className="bg-white/5 border-white/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white h-12 hover:bg-white/10 transition-all">
                          <SelectValue placeholder="Wähle deine Branche" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/20 backdrop-blur-xl">
                          <SelectItem value="medical" className="text-white hover:bg-white/10 focus:bg-white/10">Medizin & Kliniken</SelectItem>
                          <SelectItem value="gastronomy" className="text-white hover:bg-white/10 focus:bg-white/10">Gastronomie</SelectItem>
                          <SelectItem value="sports" className="text-white hover:bg-white/10 focus:bg-white/10">Sport & Fitness</SelectItem>
                          <SelectItem value="realestate" className="text-white hover:bg-white/10 focus:bg-white/10">Immobilien</SelectItem>
                          <SelectItem value="ecommerce" className="text-white hover:bg-white/10 focus:bg-white/10">E-Commerce</SelectItem>
                          <SelectItem value="other" className="text-white hover:bg-white/10 focus:bg-white/10">Sonstiges</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-white font-medium flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-400 rounded-full" />
                        Interesse (mindestens 1 auswählen)
                      </Label>
                      <div className="space-y-2">
                        {[
                          'Cutting-Edge Webdesign',
                          'AI Automations',
                          'AI Receptionist',
                          'AI Content Creation',
                        ].map((interest) => (
                          <motion.div
                            key={interest}
                            whileHover={{ x: 5, scale: 1.02 }}
                            className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-400/50 transition-all duration-300 cursor-pointer group"
                            onClick={() => toggleInterest(interest)}
                          >
                            <Checkbox
                              id={interest}
                              checked={interests.includes(interest)}
                              onCheckedChange={() => toggleInterest(interest)}
                              className="border-white/30 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-500 data-[state=checked]:border-transparent transition-all duration-300"
                            />
                            <label
                              htmlFor={interest}
                              className="text-sm text-gray-300 cursor-pointer group-hover:text-white transition-colors font-medium flex-1"
                            >
                              {interest}
                            </label>
                            <Sparkles className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        variant="outline"
                        className="flex-1 bg-white/5 border-white/20 hover:bg-white/10 text-white py-6 rounded-xl transition-all duration-300"
                      >
                        Zurück
                      </Button>
                      <Button
                        type="button"
                        onClick={() => canProceedStep2 && setCurrentStep(3)}
                        disabled={!canProceedStep2}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-6 rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
                      >
                        Weiter
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Project Details */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-3">
                      <Label className="text-white font-medium flex items-center gap-2">
                        <span className="w-2 h-2 bg-pink-400 rounded-full" />
                        Wunschzeitraum für Start
                      </Label>
                      <Select
                        value={formData.timeline}
                        onValueChange={(value) => updateFormData('timeline', value)}
                        required
                      >
                        <SelectTrigger className="bg-white/5 border-white/20 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 text-white h-12 hover:bg-white/10 transition-all">
                          <SelectValue placeholder="Wähle einen Zeitraum" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/20 backdrop-blur-xl">
                          <SelectItem value="asap" className="text-white hover:bg-white/10 focus:bg-white/10">So schnell wie möglich</SelectItem>
                          <SelectItem value="1-2months" className="text-white hover:bg-white/10 focus:bg-white/10">In 1–2 Monaten</SelectItem>
                          <SelectItem value="3+months" className="text-white hover:bg-white/10 focus:bg-white/10">In 3+ Monaten</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <motion.div
                      className="space-y-3"
                      animate={focusedField === 'goal' ? { scale: 1.02 } : { scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Label htmlFor="goal" className="text-white font-medium flex items-center gap-2">
                        <span className="w-2 h-2 bg-pink-400 rounded-full" />
                        Was ist Ihr Ziel mit diesem Projekt?
                      </Label>
                      <Textarea
                        id="goal"
                        value={formData.goal}
                        onChange={(e) => updateFormData('goal', e.target.value)}
                        onFocus={() => setFocusedField('goal')}
                        onBlur={() => setFocusedField(null)}
                        required
                        rows={5}
                        placeholder="Beschreiben Sie Ihre Vision und Ihre Ziele..."
                        className="bg-white/5 border-white/20 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 text-white placeholder:text-gray-500 resize-none transition-all duration-300 hover:bg-white/10"
                      />
                    </motion.div>

                    <motion.div
                      className="space-y-3"
                      animate={focusedField === 'preferredTime' ? { scale: 1.02 } : { scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Label htmlFor="preferred-time" className="text-white font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-pink-400" />
                        Bevorzugte Zeit für einen Call (Optional)
                      </Label>
                      <Input
                        id="preferred-time"
                        value={formData.preferredTime}
                        onChange={(e) => updateFormData('preferredTime', e.target.value)}
                        onFocus={() => setFocusedField('preferredTime')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="z.B. Montag–Mittwoch, 14–17 Uhr"
                        className="bg-white/5 border-white/20 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 text-white placeholder:text-gray-500 transition-all duration-300 hover:bg-white/10 h-12"
                      />
                    </motion.div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        variant="outline"
                        className="flex-1 bg-white/5 border-white/20 hover:bg-white/10 text-white py-6 rounded-xl transition-all duration-300"
                      >
                        Zurück
                      </Button>
                      <Button
                        type="submit"
                        disabled={!canSubmit}
                        className="flex-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white font-bold py-6 text-lg rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group relative overflow-hidden"
                      >
                        <motion.div
                          className="absolute inset-0 bg-white/20"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                        <span className="relative z-10 flex items-center">
                          <Rocket className="mr-2 w-5 h-5" />
                          Erstgespräch anfragen
                        </span>
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

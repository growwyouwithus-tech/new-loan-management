import { Phone, Mail } from 'lucide-react'

export default function SidebarSupport() {
    return (
        <div className="bg-white/10 rounded-xl p-3 border border-white/10 mx-2 mb-2">
            <p className="text-xs font-semibold text-white/70 uppercase mb-2 px-1">Support Contact</p>
            <div className="space-y-2">
                <div className="flex items-start gap-2 text-white/90">
                    <Phone className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                        <p>9999555584</p>
                        <p>8882823566</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <p className="text-xs break-all">maxborngroup@gmail.com</p>
                </div>
            </div>
        </div>
    )
}

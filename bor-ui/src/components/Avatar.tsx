import React from 'react'
import clsx from 'clsx'

interface AvatarProps {
    avatar: string;
    username: string;
    className?: string;
    imgClassName?: string;
}

const Avatar: React.FC<AvatarProps> = ({ avatar, username, className, imgClassName }) => {
    return (
        <div className={clsx("relative", className)}>
            <img
                src={avatar}
                className={clsx(
                    "w-10 h-10 rounded-full border-2 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]",
                    imgClassName
                )}
                alt={username}
            />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[0.4rem] px-1 py-0.5 rounded-full font-bold shadow-[0_0_10px_rgba(239,68,68,0.7)]">
                LIVE
            </div>
        </div>
    )
}

export default Avatar